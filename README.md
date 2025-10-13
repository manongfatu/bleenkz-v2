# Bleenkz

Bleenkz is an eye-enabled web app that counts blinks in real time, gamifies them into achievements, and integrates with both Web2 and Web3 platforms. It never collects or stores biometric data—only detects simple eye movements (blinks). While users browse or interact with apps/dApps, they earn points in the background, making every blink valuable.

## Prerequisites

- Node.js 18+
- npm 9+
- Camera access (browser prompt)
- Ollama (optional, for AI one‑liners)
  - Install: `brew install ollama`
  - Start: `ollama serve`
  - Pull a model (pick one): `ollama pull llama3.1`

## Install & Run (Local)

```bash
# From the project root
npm install

# Start the local server (http://localhost:3000)
npm run start
```

In another terminal (optional, enables AI popups):

```bash
# Start Ollama locally
ollama serve
# Ensure a model is available
ollama pull llama3.1
```

Open the app:

- http://localhost:3000

## What you’ll see

- Animated space background with a minimalist cockpit HUD (AI/CAM/NET, battery, time)
- Blink counter, speedometer, achievements, and $BLNKZ token card
- Bottom popup shows fun motivational one‑liners
  - Uses Ollama when available; otherwise falls back to built-in messages

## Controls

- Test Blink: increments the counter and may trigger a popup
- Test Detection: logs MediaPipe readiness info to the console
- Reset: resets session stats and achievements

## AI Integration (Ollama)

- The app calls a local proxy at `/api/ollama` (see `server.js`)
- Default model: `llama3.1`
- Change model: edit `server.js` (model default) or update the client payload
- NET HUD indicator turns ON when Ollama or price API requests succeed, OFF on fallback/error

## Bitcoin Price

- Tries CoinGecko (via AllOrigins). If that fails, tries Coinbase.
- Falls back to a simulated price if both fail (NET HUD turns OFF).

## Troubleshooting

- Browser asks for camera permission: allow it to enable blink detection
- If AI popups never use Ollama:
  - Ensure `ollama serve` is running
  - Ensure a model is present: `ollama pull llama3.1`
  - Check server logs: `/tmp/bleenkz.log`
- Port in use: stop other processes on 3000 or change the port in `server.js`

## Scripts

- `npm run start` – start the Express server (serves static files and proxies `/api/ollama`)
- `npm run dev` – start with nodemon (auto-reload)

## Project Structure

```
index.html      # App markup
style.css       # Theme, cockpit HUD, layout, animations
script.js       # Blink logic, MediaPipe, UI, crypto, HUD, Ollama calls
server.js       # Express server + Ollama proxy
img/            # Assets
```

## License

ISC (see `package.json`).
