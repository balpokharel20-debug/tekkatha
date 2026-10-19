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
- MongoDB-backed product catalog, search, filtering, NPR price records, specification sources, and comparisons
- Admin sign-in with scrypt password hashing and HTTP-only, SameSite cookies; session tokens are hashed in MongoDB and expire after eight hours
- Super admins can open CMS → Administrators to create additional Admin or Super admin accounts. New passwords are hashed before storage, duplicate email addresses are rejected, and regular Admin accounts cannot access the administrator management screen.
- Create and edit articles; drafts stay private, while published articles are available through the public API
- Create and edit product specifications, configurations, prices, retailer sources, timestamps, and availability
- Product records include an **Add variant** editor. Each variant stores its own label, NPR price, verification, retailer source, date checked, and availability. The public product page keeps every variant in the same view with a selector and separate price display.
- Editorial posts can select products from the CMS. Selected products appear below the article with their image, variant, price, verification label, and key specifications, which supports buying guides such as “Best phones under Rs. 50,000”.
- Separate long description and device review fields in the product editor, up to 100,000 characters each. MongoDB stores the text with paragraph and line breaks preserved. Full device pages display populated sections with reading links; empty sections stay hidden. The public catalog and assistant exclude the long text, which loads only when opening a device page, with retry on failure.
- Upload local device images (JPEG, PNG, WebP; up to 12 MB), with preview and browser compression to at most 1600 pixels on the longest edge and 350 KB; MongoDB stores the Base64 data URL as text in the product's `image` field, and saving a replacement atomically overwrites the old image text
- Archive and restore articles and products; the CMS does not permanently delete content
- Shared brand identity, SEO description, assistant naming, and contact naming settings
- Footer SEO code under CMS → Brand settings: paste additional HTML and complete script/JSON-LD blocks (up to 50,000 characters). MongoDB stores the exact code as text in `footerSeoCode`; saving replaces it, and clearing the field removes additional code on the next public page load. Only authenticated administrators can edit it. Executable snippets run once per document, including across internal navigation.
- Automatic Organization, WebSite, and WebPage JSON-LD below the public footer, with an HTML preview in the CMS. Canonical URLs and descriptions update on navigation; article excerpts and product summaries describe their own pages. Placeholder mailboxes, sample prices, and invented ratings are excluded from structured data. JSON-LD follows [Google Search's supported body markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
- A styled XML sitemap index at `/sitemap_index.xml`, with separate page, published article, and product sitemaps. `/robots.txt` advertises the index. The footer links to the XML index; `/sitemap` remains a browsable page for visitors.
- Tekkatha AI uses the OpenAI-compatible service at `https://ai.shahnishant.com.np` through the backend. Web search and model tools are disabled. The service receives only the visitor question, up to eight recent messages, and a maximum of eight locally selected product records with an explicit field allowlist.
- The full assistant and floating chat share a bounded conversation, product context, and draft. AI-selected product IDs are checked against the supplied context, while product cards, links, prices, and comparison data are rebuilt from MongoDB. If the remote service fails, the deterministic catalog assistant answers instead.
- Ads & placements workspace: create/edit banner campaigns, assign multiple locations, enable/pause, set local start/end dates, and archive/restore; supports compressed static uploads and animated GIF uploads up to 2 MB (including GIF files named `.gof`), stored as image text in MongoDB
- Popup notices workspace: publish an image or English text announcement, add an optional link, schedule it, and choose first visit, every visit, or repeat-after-days display rules. Visitors can dismiss notices, and uploaded images are compressed into MongoDB text.
- Six public ad locations with equal shuffled rotation every eight visible seconds, no consecutive repeat when multiple ads are available, and visitor pause/next controls; rotation pauses offscreen, in hidden tabs, and while hovered or focused. Empty locations collapse. Open pages refresh campaigns every minute.
- Responsive light and dark interfaces with a custom SVG wordmark, mark, and favicon
- Product prices are shown in Nepalese rupees throughout the public website, with verification labels explaining whether each price is a sample or has a recorded source.
- English-only public copy with anonymous, opt-in viewer analytics in CMS → Viewer analytics. The dashboard reports page views, anonymous viewers, time spent, pages, device type, browser, operating system, and language without storing names or IP addresses.

## Checks and builds

```sh
npm test
npm run build
npm run smoke --workspace backend
npm run smoke:ads --workspace backend
```

The smoke check requires the running backend and the initial local credentials file. It checks MongoDB persistence, admin authentication, draft privacy, publishing, archive/restore, product creation, assistant answers, and logout. It removes only its own temporary records. Production builds are written to `frontend/dist/` and `admin/dist/`.

GitHub Actions runs the backend test suite, builds both browser apps, and builds all three deployment images on each push and pull request.

## Production deployment

### Vercel

The repository also supports a single Vercel project for the public site, API, and CMS. Set the Vercel Root Directory to the repository root, use `npm run build:vercel` as the build command, and set the output directory to `public`. Vercel serves the public site and CMS assets from that folder and detects the root `app.js` as the Express application. The CMS is available at `/cms/hello`; it shares the public site's HTTPS origin and session cookie.

Add `MONGODB_URI` and `MONGODB_DATABASE` as Production environment variables in the Vercel project. Use a remote MongoDB deployment with TLS, a least-privilege user, backups, and network access configured for Vercel. Expose Vercel's project URL system environment variables so the generated production URL is used as the canonical origin. After choosing a custom domain, set `PUBLIC_SITE_URL` and `ALLOWED_ORIGINS` to the HTTPS site origin; for this single-origin setup, both values can be that same origin. Keep database and AI credentials in Vercel's encrypted environment settings, never in Git or chat.

After the first production deployment, initialize the first administrator from a trusted local terminal using the linked Vercel project's Production environment. Set `NODE_ENV=production`, `VERCEL=1`, `PUBLIC_SITE_URL` to the deployment's HTTPS origin, `ALLOWED_ORIGINS` to that same origin, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 16 characters in that terminal. Then run `vercel env run -e production -- npm run setup:production`; remove the shell variables afterward. This creates the administrator only when the database has no admin and does not seed example articles or products. Sign in at `/cms/hello`.

Vercel Functions cap request and response bodies at 4.5 MB. The CMS blocks product saves above 3.75 MiB and the Vercel API parser uses a 4 MB limit; large review images should be uploaded as hosted image URLs. Product catalog responses already use separate image endpoints to keep image bytes out of API responses. Confirm your Vercel plan's function limits and MongoDB network policy before launch.

The repository includes a Docker Compose deployment for a Linux server with Docker Compose, Caddy, and a managed MongoDB deployment. It runs the public site and CMS behind separate HTTPS hostnames, keeps the API private behind the two site containers, and does not start with sample content. Choose the real site and CMS domains before deployment; `example.com` values in the template are not live settings.

1. Point the site's DNS records to your server, install Docker Compose and Caddy, and open ports 80 and 443. Copy `deploy/production.env.example` to `deploy/production.env`, replace both HTTPS origins with your real domains, and add a TLS-enabled MongoDB URI for a dedicated application user. Keep this file private; it is ignored by Git.
2. Put the MongoDB connection in a managed database with TLS, a least-privilege application user, network access restricted to the server, and automated backups. Do not use the development database or deploy the sample records from `backend/seeds/content.json`.
3. Install the sample `deploy/Caddyfile.example` as your Caddyfile after changing its two hostnames. It obtains and renews HTTPS certificates and forwards traffic to the two loopback-only site ports.
4. Run `docker compose --env-file deploy/production.env up --build -d`. The frontend and CMS are built with their production domains; the backend rejects missing, insecure, or loopback production settings at startup.
5. Create the first super administrator once, without seeding sample articles or products. Set `ADMIN_EMAIL` and a unique 16-character-or-longer `ADMIN_PASSWORD` in the shell environment, run `docker compose --env-file deploy/production.env run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD backend node backend/scripts/production-setup.js`, then remove those shell variables. Store the credentials in a password manager. The initializer refuses to overwrite an existing admin and never prints or writes the password; those one-time variables are passed only to the initialization container, not the running API.
6. Sign in at `https://<your-CMS-domain>/hello`. Set the real contact mailboxes, publication details, privacy and terms copy, publish reviewed articles and verified device data, and verify retailer links. The seeded content is intentionally illustrative and must not be published as factual reporting or current pricing.
7. Check the public website, admin sign-in, an admin save, AI fallback and provider connection, image uploads, mobile layout, accessibility contrast, sitemap endpoints, 404 behavior, and restore from a database backup before launch. Submit the production sitemap in Google Search Console. Track real Core Web Vitals and search queries after launch.

The deployment binds ports 8080 and 8081 to `127.0.0.1`; Caddy handles public TLS. Published article and product pages are served with server-rendered content, canonical metadata, and structured data for search and social crawlers. Product photos stored in MongoDB are served through versioned public image endpoints instead of being repeated as large Base64 strings in catalog API responses. Structured product offers appear only for source-linked prices checked within the last 30 days; sample prices and unverified prices are never advertised as live offers. If another load balancer or CDN sits in front of Caddy, configure it to pass the actual client IP securely and set `TRUST_PROXY_HOPS` to the real trusted proxy count. `deploy/production.env.example` contains placeholders only and cannot be deployed without real domains and MongoDB credentials. A launch still requires the domain owner to supply those values and replace sample editorial content.

For a hosted site, set `PUBLIC_SITE_URL` in the backend environment to the public frontend origin (for example, `https://tekkatha.com`). Route `/robots.txt`, `/sitemap.xml`, `/sitemap_index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml`, `/product-sitemap.xml`, and `/sitemap.xsl` on that origin to the backend. The Vite development server proxies these paths automatically.

## API

Public reads: `GET /api/articles`, `GET /api/articles/:id`, `GET /api/products`, `GET /api/products/:id`, and `GET /api/settings`. Lists support pagination; products also support `q`, `type`, `brand`, `maxPrice`, and price sorting. `POST /api/assistant` accepts a question plus optional bounded history and product context: `{ "question": "...", "history": [{ "role": "user", "content": "..." }], "contextProductIds": ["product-id"] }`.

Advertising: `GET /api/ads` exposes only enabled campaigns within their UTC-normalized schedules. Admin routes are `GET/POST /api/admin/ads`, `PUT/DELETE /api/admin/ads/:id`, `POST /api/admin/ads/:id/restore`, and `PATCH /api/admin/ads/:id/active` with `{ "active": true/false }`. Ad writes support up to 3 MB of JSON for animated GIF text; other requests retain their 1 MB limit. No campaigns are enabled or seeded by default.

Popup notices: `GET /api/popup-notice` exposes the newest enabled, scheduled notice. Admin routes are `GET/POST /api/admin/notices`, `PUT/DELETE /api/admin/notices/:id`, `POST /api/admin/notices/:id/restore`, and `PATCH /api/admin/notices/:id/active`. Notice display frequency is enforced in the visitor's browser using local/session storage.

Uploaded ad images remain Base64 text in MongoDB. The public campaign list uses `/api/ads/:id/image` URLs so the browser loads only the banners it displays instead of downloading every encoded GIF during each campaign refresh. Paused, archived, or out-of-schedule images are not publicly served.

Authentication: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`. Admin CRUD: `/api/admin/articles`, `/api/admin/products`, their `/:id` and `/:id/restore` endpoints, `/api/admin/stats`, and `/api/admin/settings`. Writes require a valid configured `Origin`, JSON content type, and an authenticated session for admin routes.

Product writes support up to 2 MB of JSON to accommodate a compressed image plus both long text fields. `description` and `review` are optional strings defaulting to empty for older products. `GET /api/products/:id` returns the full text, while `GET /api/products` returns catalog summaries without these fields. The text is displayed safely as paragraphs rather than executed as HTML.

Article writes accept an optional `productIds` array with up to 30 unique product IDs. Older articles default to an empty selection.

## Content and service connections

Seeded Nepal prices are illustrative and local availability is unverified. Source-recorded prices require a retailer URL and date checked. Product SVGs are simplified illustrations. The AI service does not receive retailer URLs, editorial reviews, long descriptions, images, admin records, sessions, analytics, or raw database documents. It has no live retailer lookup. Contact email addresses are naming placeholders until actual mailboxes are configured.

AI configuration lives only in `backend/.env`. Defaults point to the approved HTTPS host and the tested small `llama-3.2-3b` model. `AI_ALLOWED_HOST` must match the destination host, redirects are rejected, and optional `AI_API_KEY` credentials never reach either browser application. Set `AI_ENABLED=false` to use the local catalog assistant only. Request time, product count, and response token limits can be reduced with `AI_TIMEOUT_MS`, `AI_MAX_PRODUCTS`, and `AI_MAX_TOKENS`.

The root `dist/` folder preserves the original standalone visual prototype. `npm run preview:prototype` runs it on port 4173; it is separate from the MongoDB application. The existing Sites deployment is this original prototype, not a hosted MongoDB backend. Deploy the three new services with a reachable MongoDB instance and configure browser API/admin origins for any hosted rollout.
