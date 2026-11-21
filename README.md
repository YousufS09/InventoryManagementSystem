# Inventory Management System

A full-stack app for managing customers and their products, with an AI assistant that understands typed or spoken commands such as *"Create product Laptop price 50000 quantity 5 for Raj"*.

Each account sees only its own customers and products.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, React Hook Form, Zod, CSS Modules |
| Backend | Node.js, Express, MySQL (mysql2), Zod, JWT, bcrypt, Helmet, express-rate-limit |
| AI / voice | Groq API (LLaMA 3 models, Orpheus text-to-speech), browser Web Speech API |
| Testing / CI | Node test runner, Vitest, GitHub Actions |
| Hosting | Netlify (frontend), Render (backend), Aiven (MySQL) |

## Features

- Sign up / sign in with JWT in an httpOnly cookie
- Customers and products: create, edit, delete, search, sort and paginate
- Dashboard: totals, inventory value, top products by stock value, low-stock list
- AI assistant (chat or voice):
  - creates records, asking for missing details one at a time
  - updates several fields at once and moves products between customers
  - asks for confirmation before any update or delete
  - asks you to choose by ID when two records share a name
- Validation on both client and server

## Project structure

```
backend/
  app.js              Express app (middleware, routes, error handling)
  server.js           Entry point: connect to MySQL, then listen
  config.js           Reads and checks environment variables
  db.js               MySQL pool; creates tables and runs migrations on startup
  schema.sql          Table definitions
  migrations.js       Upgrades databases created by older versions
  routes/             URL → controller mapping (all data routes require login)
  controllers/        Request handling and validation
  services/           Database queries (customers, products, dashboard, sessions) and AI calls
  utils/              Validation schemas, date parsing, list query helpers
  test/               Unit, API and assistant tests
frontend/
  src/pages/          Dashboard, Customers, Products, AI Assistant, Sign in/up
  src/components/     atoms / molecules / organisms
  src/context/        AuthContext (signed-in user)
  src/hooks/          usePagedList, useSpeechRecognition
  src/services/       API client
  src/validation/     Form schemas (Zod)
```

## Running locally

Requirements: Node.js 22+, MySQL 8.

```powershell
# 1. Backend
cd backend
copy .env.example .env      # then fill in the values (see below)
npm install
npm run dev                 # http://localhost:4000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The backend creates its tables on first start. The database named in `DB_NAME` must already exist (`CREATE DATABASE inventory_db;`).

### Backend environment variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | yes | At least 32 random characters. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | yes | MySQL connection |
| `DB_SSL` | no | `true` for Aiven (uses `certs/aiven-ca.pem`) |
| `GROQ_API_KEY` | for the assistant | From https://console.groq.com/keys |
| `GROQ_TTS_VOICE` | no | Orpheus voice, default `hannah` |
| `FRONTEND_URL` | production | Exact Netlify URL, for CORS |
| `JWT_EXPIRES_IN` | no | Default `2h` |
| `TRUST_PROXY_HOPS` | no | Proxies in front of the app in production, default `2` (Netlify → Render) |
| `AUTH_RATE_LIMIT` | no | Sign in/up attempts per IP per 15 minutes, default `10` |

`.env` files are git-ignored. Never commit real keys.

## API

All routes except sign up / sign in / logout require the auth cookie (or `Authorization: Bearer <token>`). Request and response bodies are JSON.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | `{ username, email, password }`. Creates the account and signs in |
| POST | `/api/auth/signin` | `{ email, password }` |
| POST | `/api/auth/logout` | Clears the auth cookie |
| GET | `/api/auth/profile` | The signed-in user |
| GET | `/api/customers` | Paged list (see query parameters below) |
| GET | `/api/customers/allCustomers` | `[{ id, customer_name }]` for dropdowns |
| POST | `/api/customers` | `{ customerName, dob, email, phone, location }` |
| PUT | `/api/customers/:id` | Any subset of the fields above |
| DELETE | `/api/customers/:id` | Also deletes the customer's products |
| GET | `/api/products` | Paged list |
| POST | `/api/products` | `{ productName, productPrice, productQuantity, customerId }` |
| PUT | `/api/products/:id` | Any subset of the fields above |
| DELETE | `/api/products/:id` | |
| GET | `/api/dashboard/stats` | Totals, `topProducts`, `lowStock` |
| POST | `/api/assistant/chat` | `{ sessionId, voiceOutput, messages: [{ role, content }] }` |

Paged lists accept `?search=&sort=&order=asc|desc&page=&pageSize=` (pageSize up to 100) and return `{ items, total, page, pageSize }`.

Errors return `{ "error": "message" }` with a 4xx/5xx status.

## Testing

```powershell
cd backend
npm run test:unit   # no database needed
npm test            # unit + API + assistant tests; uses the database in .env

cd ../frontend
npm test            # form validation and formatting
npm run lint
```

Backend tests create users with `@test.invalid` emails and delete them (and their data) afterwards. The assistant tests replace the Groq calls with stand-ins, so they need no API key.

GitHub Actions (`.github/workflows/ci.yml`) runs all of the above on every push and pull request, using a throwaway MySQL 8 container.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
