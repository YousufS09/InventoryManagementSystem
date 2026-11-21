# Deployment Guide

This project is set up to deploy as:

- Frontend: Netlify
- Backend: Render

## 1. Deploy the backend to Render

Create a new **Web Service** in Render and point it to this repository.

Use these settings:

- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Set these environment variables in Render:

- `NODE_ENV=production`
- `FRONTEND_URL=https://your-netlify-site.netlify.app`
- `JWT_SECRET` — required, at least 32 random characters. The server refuses to start without it. `render.yaml` generates one automatically.
- `JWT_EXPIRES_IN=2h`
- `DB_HOST=mysql-ims-inventory-management-system-123.l.aivencloud.com`
- `DB_PORT=19875`
- `DB_USER=avnadmin`
- `DB_PASSWORD=your-aiven-password`
- `DB_NAME=defaultdb`
- `DB_SSL=true`
- `GROQ_API_KEY=your-groq-api-key` if you want the AI assistant features enabled. Set it only in the Render dashboard, never in a committed file.
- `GROQ_TTS_VOICE` (optional) — Orpheus voice for spoken replies, default `hannah`

After deploy, copy your Render backend URL. It will look like:

`https://inventory-management-backend.onrender.com`

## 2. Deploy the frontend to Netlify

Create a new site in Netlify and point it to this repository.

Use these settings:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`

Do **not** set `VITE_API_BASE_URL` in Netlify. If an old value is there, delete it.

The included [`netlify.toml`](netlify.toml) handles SPA routing and forwards every `/api/*` request to the Render backend. The browser then talks only to the Netlify domain, so the login cookie is first-party and works in Safari and in browsers that block third-party cookies.

If your Render URL is not `https://inventory-management-backend.onrender.com`, change the `to = ...` line in `netlify.toml` to match.

## 3. Update backend CORS after Netlify is live

Once Netlify gives you the final frontend URL, make sure Render has:

- `FRONTEND_URL=https://your-final-site.netlify.app`

Then trigger a redeploy on Render.

## 4. Important notes

- The frontend sends requests with `credentials: "include"`, so the backend must keep `FRONTEND_URL` exactly matched to the Netlify URL.
- Requests reach Render through two proxies (Netlify, then Render's own), so `TRUST_PROXY_HOPS` defaults to `2`. Set it to `1` if you call Render directly without the Netlify proxy.
- The backend also creates `assistant_sessions` and upgrades older tables automatically (see `backend/migrations.js`). Customers created before per-user data have no owner and stay hidden.
- If your Render service sleeps on the free plan, the first request may be slow.
- If the AI assistant is not needed, you can leave `GROQ_API_KEY` unset; the assistant then replies with an error message.
- All `/api/customers`, `/api/products`, `/api/dashboard` and `/api/assistant` routes require a signed-in user.
- The backend creates the `user`, `customers`, `products` and `assistant_sessions` tables on startup if they are missing (see `backend/schema.sql`).
- `.env` files are git-ignored. Keep real secrets only in local `.env` files and in the Render/Netlify dashboards.

## 5. Local Aiven CLI test

If you want to test the Aiven MySQL connection from Windows PowerShell, use:

```powershell
mysql --user=avnadmin --host=mysql-ims-inventory-management-system-123.l.aivencloud.com --port=19875 --ssl-mode=REQUIRED -p defaultdb
```

Important:
- Do not type the host by itself as a command.
- Do not use `--password=<value>` with angle brackets in PowerShell.
- When prompted for the password, type the real Aiven password and press Enter.
