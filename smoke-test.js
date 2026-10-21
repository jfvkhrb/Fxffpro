// Local smoke test: server must already be running. Creates one test account.
const base = process.env.CRAFTSERVER_URL || 'http://127.0.0.1:3000';
const email = `smoke-${Date.now()}@example.com`;
const password = `Test-${Date.now()}-SafePass`;
async function request(route, data, cookie) {
  const response = await fetch(base + route, {
    method: data ? 'POST' : 'GET',
    headers: { ...(data ? {'content-type':'application/json'} : {}), ...(cookie ? {cookie} : {}) },
    body: data ? JSON.stringify(data) : undefined,
    redirect: 'manual'
  });
  let body = {};
  try { body = await response.json(); } catch {}
  const setCookie = response.headers.get('set-cookie');
  return {status: response.status, body, cookie: setCookie ? setCookie.split(';')[0] : cookie};
}
(async () => {
  const health = await request('/api/health');
  if (health.status !== 200 || !health.body.ok) throw new Error('Health check failed');
  console.log('PASS /api/health');
  const registered = await request('/api/register', {email, password});
  if (registered.status !== 200 || !registered.cookie) throw new Error('Register failed: ' + JSON.stringify(registered.body));
  console.log('PASS register + session cookie');
  const me = await request('/api/me', null, registered.cookie);
  if (me.status !== 200 || me.body.email !== email || me.body.coins !== 100) throw new Error('Authenticated /api/me failed: ' + JSON.stringify(me.body));
  console.log('PASS authenticated dashboard API + starter coins');
  const loggedOut = await request('/api/logout', {}, registered.cookie);
  if (loggedOut.status !== 200) throw new Error('Logout failed');
  const afterLogout = await request('/api/me', null, registered.cookie);
  if (afterLogout.status !== 401) throw new Error('Session remained active after logout');
  console.log('PASS logout invalidates session');
  const loggedIn = await request('/api/login', {email, password});
  if (loggedIn.status !== 200 || !loggedIn.cookie) throw new Error('Login failed: ' + JSON.stringify(loggedIn.body));
  const meAgain = await request('/api/me', null, loggedIn.cookie);
  if (meAgain.status !== 200) throw new Error('Login session verification failed');
  console.log('PASS login + regenerated session');
  console.log('ALL AUTH SMOKE TESTS PASSED');
  console.log('Test account created:', email, '(local JSON database; delete it manually if desired)');
})().catch(e => { console.error('FAIL:', e.message); process.exitCode = 1; });
