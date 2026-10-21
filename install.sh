#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v pkg >/dev/null 2>&1; then
  echo "This installer is intended for Android Termux. Install Node.js and unzip manually on other systems." >&2
  exit 1
fi
pkg update -y
pkg install nodejs unzip -y
npm install --no-audit --no-fund
if [ ! -f .env ]; then
  node -e "require('fs').writeFileSync('.env','SESSION_SECRET='+require('crypto').randomBytes(32).toString('hex')+'\\nHOST=127.0.0.1\\nPORT=3000\\n')"
fi
chmod 600 .env
echo 'Setup complete. Start with: bash start.sh'
echo 'Optional Owner/Admin: register first, then set ADMIN_EMAIL before starting the panel.'
