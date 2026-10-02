# Self-Healing Site

A React + Vite app that demonstrates global error capture and a live error dashboard.

## Architecture

```
client/   ← React + Vite (port 5173)
server/   ← Node / Express (port 3001)
```

- A global `window.onerror` + `unhandledrejection` handler in `main.jsx` POSTs every error to the Express API.
- The Express server appends errors to `server/errors.json`.
- The Dashboard page polls `GET /api/errors` every 3 seconds and shows all captured errors.

## Running locally

Open two terminals:

**Terminal 1 – Express server**
```bash
cd server
npm start          # or: node --watch index.js
```

**Terminal 2 – Vite dev server**
```bash
cd client
npm run dev
```

Then open **http://localhost:5173**.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Two buttons that fire different JS errors |
| `/dashboard` | Live error table (auto-refreshes every 3 s) |

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/errors` | Append an error `{ message, file, line, time }` |
| `GET` | `/api/errors` | Return all errors (newest first) |
| `DELETE` | `/api/errors` | Clear all errors |
