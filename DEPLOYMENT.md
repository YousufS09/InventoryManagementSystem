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
- `JWT_SECRET=your-strong-random-secret`
- `JWT_EXPIRES_IN=2h`
- `DB_HOST=mysql-ims-inventory-management-system-123.l.aivencloud.com`
- `DB_PORT=19875`
- `DB_USER=avnadmin`
- `DB_PASSWORD=your-aiven-password`
- `DB_NAME=defaultdb`
- `DB_SSL=true`
- `GROQ_API_KEY=your-groq-api-key` if you want the AI assistant features enabled

After deploy, copy your Render backend URL. It will look like:

`https://inventory-management-backend.onrender.com`

## 2. Deploy the frontend to Netlify

Create a new site in Netlify and point it to this repository.

Use these settings:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`

Set this environment variable in Netlify:

- `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

The included [`netlify.toml`](/C:/Users/Mohamed%20Yousuf/Downloads/Professional/InventoryManagementSystem/netlify.toml) already handles SPA routing.

## 3. Update backend CORS after Netlify is live

Once Netlify gives you the final frontend URL, make sure Render has:

- `FRONTEND_URL=https://your-final-site.netlify.app`

Then trigger a redeploy on Render.

## 4. Important notes

- The frontend sends requests with `credentials: "include"`, so the backend must keep `FRONTEND_URL` exactly matched to the Netlify URL.
- In production, auth cookies are sent with `SameSite=None` and `Secure`, which is correct for Netlify <-> Render over HTTPS.
- If your Render service sleeps on the free plan, the first request may be slow.
- If the AI assistant is not needed, you can leave `GROQ_API_KEY` unset, but assistant routes may fail.

## 5. Local Aiven CLI test

If you want to test the Aiven MySQL connection from Windows PowerShell, use:

```powershell
mysql --user=avnadmin --host=mysql-ims-inventory-management-system-123.l.aivencloud.com --port=19875 --ssl-mode=REQUIRED -p defaultdb
```

Important:
- Do not type the host by itself as a command.
- Do not use `--password=<value>` with angle brackets in PowerShell.
- When prompted for the password, type the real Aiven password and press Enter.
