#!/usr/bin/env node
'use strict';
// Safe local Minecraft runtime smoke test: runs the chosen JAR in an isolated temp folder,
// binds it to loopback/ephemeral port, waits for the server-ready line, then stops it.
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawn, spawnSync } = require('child_process');
const root = __dirname;
const dbPath = path.join(root, 'data', 'db.json');
const serversRoot = path.join(root, 'data', 'servers');
const java = process.env.JAVA_BIN || 'java';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, answer => resolve(answer.trim())));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const jv = spawnSync(java, ['-version'], { encoding: 'utf8', timeout: 8000 });
  if (jv.error || jv.status !== 0) {
    console.error('FAIL: Java is unavailable or could not run:', jv.error?.message || jv.stderr || jv.status);
    process.exitCode = 1; return;
  }
  console.log('Java check: PASS');
  console.log((jv.stderr || jv.stdout || '').trim());
  if (!fs.existsSync(dbPath)) {
    console.error('No data/db.json found. Start CraftServer and create a server entry first.');
    process.exitCode = 1; return;
  }
  let db;
  try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
  catch { console.error('Could not parse data/db.json.'); process.exitCode = 1; return; }
  const servers = Array.isArray(db.servers) ? db.servers : [];
  if (!servers.length) {
    console.error('No server entry found. Create a server from the panel first.');
    process.exitCode = 1; return;
  }
  console.log('\nAvailable server entries:');
  servers.forEach((s, i) => console.log(`${i + 1}. ${s.name || '(unnamed)'} — ID: ${s.id}`));
  const chosen = await ask('\nEnter the number of the server whose server.jar you want to test: ');
  const index = Number(chosen) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= servers.length) {
    console.error('Invalid selection.'); process.exitCode = 1; return;
  }
  const entry = servers[index];
  const jar = path.join(serversRoot, String(entry.id), 'server.jar');
  if (!fs.existsSync(jar)) {
    console.error(`FAIL: JAR not found: ${jar}`);
    console.error('Put a Java Edition server JAR there, then run this test again.');
    process.exitCode = 1; return;
  }
  console.log('\nThis test copies the JAR to a temporary folder. It does not use your saved world.');
  console.log('The temporary server is configured for loopback/ephemeral port only and is not intended for players.');
  console.log('Read the Minecraft EULA at https://www.minecraft.net/eula before proceeding.');
  const consent = await ask('If you agree to the EULA, type I AGREE to run the temporary test: ');
  if (consent !== 'I AGREE') { console.log('Cancelled; no server process was started.'); return; }

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'craftserver-runtime-test-'));
  let child = null;
  let done = false;
  let failed = false;
  let sawReady = false;
  let output = '';
  const finish = async (code, message) => {
    if (done) return;
    done = true;
    if (child && child.exitCode === null) {
      try { child.stdin.write('stop\n'); } catch {}
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(8000)]);
      if (child.exitCode === null) child.kill('SIGTERM');
    }
    try { fs.rmSync(temp, { recursive: true, force: true }); } catch {}
    console.log(message);
    rl.close();
    if (code !== 0) process.exitCode = code;
  };
  try {
    fs.copyFileSync(jar, path.join(temp, 'server.jar'));
    fs.writeFileSync(path.join(temp, 'eula.txt'), 'eula=true\n');
    fs.writeFileSync(path.join(temp, 'server.properties'), [
      'server-ip=127.0.0.1', 'server-port=0', 'online-mode=false',
      'enable-status=false', 'max-players=1', 'view-distance=4',
      'simulation-distance=4', 'spawn-protection=0', 'motd=CraftServer temporary runtime test'
    ].join('\n') + '\n');
    console.log('\nStarting temporary Minecraft server with -Xms256M -Xmx1G (max wait 180 seconds)...');
    child = spawn(java, ['-Xms256M', '-Xmx1G', '-jar', 'server.jar', 'nogui'], { cwd: temp, stdio: ['pipe', 'pipe', 'pipe'] });
    const onData = chunk => {
      const text = chunk.toString();
      output = (output + text).slice(-16000);
      for (const line of text.split(/\r?\n/).filter(Boolean)) console.log(line);
      if (/Done \([^)]+\)! For help/i.test(output) || /Done \([^)]+\)! For help/i.test(text)) {
        sawReady = true;
        finish(0, '\nPASS: Minecraft reported that startup completed. The temporary server was stopped and its test folder removed.');
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', err => finish(1, `\nFAIL: Could not launch Java process: ${err.message}`));
    child.on('exit', (code, signal) => {
      if (!done) finish(1, `\nFAIL: Server exited before reporting ready (code=${code}, signal=${signal}). Review the log above for Java/version/memory errors.`);
    });
    setTimeout(() => {
      if (!done) finish(1, '\nFAIL: Timed out after 180 seconds without a ready message. Review the log above; the phone may be short on RAM or the JAR may require a different Java version.');
    }, 180000).unref?.();
  } catch (err) {
    await finish(1, `\nFAIL: Runtime test setup failed: ${err.message}`);
  }
  // Keep rl open while server runs; finish() closes it.
}
main().catch(err => { console.error(err); process.exitCode = 1; rl.close(); });
