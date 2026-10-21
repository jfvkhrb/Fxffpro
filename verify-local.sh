#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
node --check server.js
node --check public/app.js
node --check smoke-test.js
node --check runtime-test.js
echo "PASS: JavaScript syntax checks"
if command -v unzip >/dev/null 2>&1; then echo "PASS: unzip available"; else echo "WARN: unzip missing (needed for world ZIP import)"; fi
if command -v java >/dev/null 2>&1; then java -version; else echo "WARN: Java not installed (needed to run Minecraft Java servers)"; fi
echo "Static checks passed. To test HTTP login, start the panel then run: node smoke-test.js"
echo "To test a real Minecraft JAR, use: node runtime-test.js (requires a compatible JAR and EULA consent)."
