# Tekkatha

Technology, Explained. A Nepal-focused technology publication with a separate public frontend, MongoDB backend, and authenticated admin panel. Light mode is the default; both interfaces include a saved dark-mode preference.

## Applications

| App | Source | Local URL |
| --- | --- | --- |
| Public frontend | `frontend/` — Vite, HTML, CSS, JavaScript | http://localhost:5173 |
| Tekkatha CMS | `admin/` — separate Vite app | http://localhost:5174/hello |
| API backend | `backend/` — Express, official MongoDB driver | http://localhost:4000/api/health |
| Database | MongoDB database `tekkatha` | `mongodb://127.0.0.1:27017/tekkatha` |

Opening `/hello` on the frontend redirects to the separate admin application. Frontend and admin requests to `/api` are proxied to the backend during development. No database connection or admin secret is bundled in either browser app.

## Run locally

Use Node.js 20.19+ or 22.12+ and a running MongoDB server. On the current Windows machine, MongoDB is already installed as a service.

```sh
npm install
npm run setup
npm run dev
```

Setup seeds eight clearly labeled sample articles, four products, and brand settings using insert-only updates. It preserves existing data and creates an initial administrator only when no admin account exists. The generated local credentials are in `.local/admin-credentials.txt`. This file, the corresponding JSON file, `.env` files, dependencies, and app build outputs are ignored by Git.

To choose your initial account, copy `backend/.env.example` to `backend/.env` and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first setup. The password must have at least 12 characters. Set `MONGODB_URI` and `MONGODB_DATABASE` there to use another MongoDB deployment.

Run individual apps with `npm run dev:frontend`, `npm run dev:backend`, and `npm run dev:admin`. Stop the combined dev process with Ctrl+C.

## Functionality

- Editorial homepage, article reader, categories, buying guides, PC and gaming content
- MongoDB-backed product database, search, filtering, NPR price records, specification sources, and comparisons
- Admin sign-in with scrypt password hashing and HTTP-only, SameSite cookies; session tokens are hashed in MongoDB and expire after eight hours
- Create and edit articles; drafts stay private, while published articles are available through the public API
- Create and edit product specifications, configurations, prices, retailer sources, timestamps, and availability
- Archive and restore articles and products; the CMS does not permanently delete content
- Shared brand identity, SEO description, assistant naming, and contact naming settings
- Tekkatha AI catalog assistant running through the backend against MongoDB records
- Floating Tekkatha AI chat on every public page, with a shared conversation and draft on the full assistant page; includes suggested questions, product links, comparisons, loading states, and retry
- Responsive light and dark interfaces with a custom SVG wordmark, mark, and favicon

## Checks and builds

```sh
npm test
npm run build
npm run smoke --workspace backend
```

The smoke check requires the running backend and the initial local credentials file. It checks MongoDB persistence, admin authentication, draft privacy, publishing, archive/restore, product creation, assistant answers, and logout. It removes only its own temporary records. Production builds are written to `frontend/dist/` and `admin/dist/`.

## API

Public reads: `GET /api/articles`, `GET /api/articles/:id`, `GET /api/products`, `GET /api/products/:id`, and `GET /api/settings`. Lists support pagination; products also support `q`, `type`, `brand`, `maxPrice`, and price sorting. `POST /api/assistant` accepts `{ "question": "..." }`.

Authentication: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`. Admin CRUD: `/api/admin/articles`, `/api/admin/products`, their `/:id` and `/:id/restore` endpoints, `/api/admin/stats`, and `/api/admin/settings`. Writes require a valid configured `Origin`, JSON content type, and an authenticated session for admin routes.

## Content and service connections

Seeded Nepal prices are illustrative and local availability is unverified. Source-recorded prices require a retailer URL and date checked. Product SVGs are simplified illustrations. The assistant currently performs catalog lookups and comparisons; an external language model and live retailer lookup are not connected. Contact email addresses are naming placeholders until actual mailboxes are configured.

The root `dist/` folder preserves the original standalone visual prototype. `npm run preview:prototype` runs it on port 4173; it is separate from the MongoDB application. The existing Sites deployment is this original prototype, not a hosted MongoDB backend. Deploy the three new services with a reachable MongoDB instance and configure browser API/admin origins for any hosted rollout.
