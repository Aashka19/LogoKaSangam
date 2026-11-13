# Frontend

The React app runs on port 5173 and uses `/api` requests. Vite proxies those requests to `http://127.0.0.1:5001` by default.

1. Copy `.env.example` to `.env` only if you need to override the defaults; `cp -n .env.example .env` preserves an existing environment file.
2. Run `npm install`.
3. Run `npm run dev`.

Open http://localhost:5173.
