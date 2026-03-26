# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
Petoi Web Coding Blocks (`code.petoi.com`) is a browser-based visual programming tool for Petoi robots (ESP32). It is a **static single-page application** — no backend, no database, no build step. The entire app is vanilla HTML/CSS/JS served by a static file server.

### Running the dev server
```
npm start          # http-server -p 8080 -c-1
```
This serves the site at `http://localhost:8080`. The `npm run dev` variant adds `-o` to auto-open the browser.

### Key pages
| Page | URL path | Purpose |
|------|----------|---------|
| Portal | `/index.html` | Language selector + links to sub-apps |
| Main IDE | `/main.html` | Blockly programming workspace |
| Remote | `/mobile_remote.html` | Mobile controller (under construction) |
| Help | `/help.html` | Documentation |

### Caveats
- `node_modules/` is **committed to the repo** (used directly by the browser at runtime via `<script>` tags). Running `npm install` is still needed to ensure `http-server` devDependency is available.
- There is **no build step, no linter, no test suite** configured in this repo. The only `package.json` scripts are `start` and `dev`.
- The app communicates with Petoi robots via WebSocket or Web Serial API — both are browser-native APIs. No robot hardware is required for UI development; the app gracefully handles missing connections.
- No `.env` files or secrets are needed.
- For tasks that require physical robot serial hardware, Cloud Agent should not perform hardware-in-the-loop validation; provide code-level checks and request user-side device verification when needed.
