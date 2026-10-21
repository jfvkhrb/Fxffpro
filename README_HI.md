# CraftServer — Integrated Local Project (Part 1–4 starter)

यह Android/Termux के लिए एक **local-first experimental** Minecraft Java server control panel है। इसमें website/account, Coins, server controls, RAM/port settings, console, Java diagnostics, World Manager, backup/restore और Java world ZIP import के शुरुआती फीचर एक ही project में रखे गए हैं। सभी features का असली फोन पर सफल परीक्षण अभी प्रमाणित नहीं है।

## Android / Termux quick start

1. ZIP extract करें और Termux में `CraftServerWeb` folder खोलें।
2. चलाएँ:

```bash
bash install.sh
bash start.sh
```

3. उसी फोन के browser में `http://127.0.0.1:3000` खोलें।
4. पहले account के लिए Register करें। Password कम-से-कम 10 characters होना चाहिए।

`install.sh` Node.js और npm dependencies install करता है और local `.env` में session secret बनाता है। World ZIP import के लिए `unzip` भी चाहिए; Termux में `pkg install unzip` चलाएँ।

## Part 1 — Website & Account

- Mobile-friendly Login/Register, Dashboard, profile, password change और logout.
- Password bcrypt से hash; login/register पर session regenerate; HTTP-only session cookie.
- Login/Register attempts पर in-memory rate limit.
- Owner/Admin overview केवल registered account के email को `ADMIN_EMAIL` से match होने पर मिलता है। Admin बनाने के लिए account पहले register करें, फिर `export ADMIN_EMAIL='your-email@example.com'` चलाकर panel restart करें।

## Part 2 — Coins

- नए account को 100 welcome coins.
- India calendar day के अनुसार +25 daily reward.
- Coins transaction history.
- RAM upgrade: 1 GB baseline; हर अतिरिक्त GB के लिए 50 coins. 1→2 GB = 50 coins; 1→4 GB = 150 coins. Downgrade पर refund नहीं.

यह local JSON ledger है, real-money payment system नहीं।

## Part 3 — Minecraft Server Management

- Server entries, Start/Stop/Restart requests, console logs/commands.
- RAM tiers 1–4 GB और TCP port assignment/check.
- Java diagnostics endpoint: `http://127.0.0.1:3000/api/diagnostics`.
- Java Edition server JAR को `data/servers/<server-id>/server.jar` में रखें। EULA पढ़ें और सहमत हों तभी उसी server folder में `eula=true` सेट करें।
- RAM setting Java startup arguments को बदलती है; यह फोन की असली available RAM नहीं बढ़ाती। Android low memory पर process kill हो सकता है।

## Part 4 — World Manager

- World folder listing, backup, restore और ZIP import.
- Backup/restore/import से पहले Minecraft server बंद होना चाहिए.
- Import के लिए Java Edition world ZIP चाहिए जिसमें `level.dat` root पर या एक top-level folder के अंदर हो. ZIP limit 100 MB; extracted content limit 500 MB; `unzip` required.
- यह Bedrock-to-Java converter नहीं है। Import से पहले अलग copy रखना बेहतर है।

## Tests

Static checks:

```bash
bash verify-local.sh
npm run test:syntax
```

HTTP login/session smoke test — panel को एक Termux session में चालू रखें, दूसरे session में project folder खोलकर चलाएँ:

```bash
node smoke-test.js
```

यह test local test account बनाता है। इसे test data वाले local install पर चलाएँ।

Real Minecraft runtime test:

```bash
node runtime-test.js
```

यह compatible `server.jar` को temporary directory में boot करने की कोशिश करता है। Minecraft EULA पहले पढ़ें; prompt पर सहमति के बिना test शुरू न करें। `PASS` केवल उस JAR के इस device पर startup तक पहुँचने का प्रमाण है, public internet connectivity का नहीं।

## GitHub one-command installer

इस project को अभी तक किसी वास्तविक GitHub repository पर publish नहीं किया गया है, इसलिए कोई valid public install URL नहीं है। `install-remote.sh` repo upload होने के बाद इस्तेमाल किया जा सकता है। पहले repository बनाएँ और ZIP contents upload करें, फिर `OWNER/REPOSITORY` को अपने असली GitHub path से बदलकर चलाएँ:

```bash
pkg update -y && pkg install curl git nodejs unzip -y && curl -fsSL https://raw.githubusercontent.com/OWNER/REPOSITORY/main/CraftServerWeb/install-remote.sh -o install-remote.sh && bash install-remote.sh OWNER/REPOSITORY
```

अगर repository की default branch `main` नहीं है या project files repository root में अलग तरह से रखे हैं, तो URL/path को उसके अनुसार बदलना होगा। यह command तब तक काम नहीं करेगा जब तक repository सच में GitHub पर मौजूद न हो।

## Safety / current limitations

- Panel default में `127.0.0.1` पर listen करता है ताकि local phone-only use हो। इसे सार्वजनिक इंटरनेट पर expose न करें।
- JSON file database और Express in-memory session store छोटे local prototype के लिए हैं, production hosting के लिए नहीं।
- HTTPS, CSRF protection, persistent database/session store, full admin actions, plugins manager, server-version installer, public network reachability, multiplayer outside the phone/network, और actual device RAM availability की guarantee शामिल नहीं है।
- Syntax/ZIP checks local development environment में किए जा सकते हैं; वास्तविक Android device पर login, world import और Minecraft JAR startup अलग से चलाकर verify करना होगा।
- यह unofficial community project है; Minecraft/Mojang/Microsoft से संबद्ध नहीं है।
