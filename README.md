# Challenge Point

Full-stack TypeScript application with React frontend and Express backend.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + MongoDB + esbuild
- **Architecture**: Monorepo with shared models and endpoints between front/back

## Prerequisites

- **Node.js** (v16+)
- **npm** (or equivalent)
- **MongoDB** reachable from your machine (see below — **Docker is optional**)

## MongoDB (local)

The API needs a `DB_CONNECTION_STRING` (see environment files). The default used in this repo’s templates is:

`mongodb://127.0.0.1:27017/challenge-point`

### Option A — Docker Compose (recommended for repeatability)

Requires [Docker](https://docs.docker.com/get-docker/) with Compose.

From the **repository root**:

```bash
docker compose up -d
```

Or use the npm alias:

```bash
npm run mongo:up
```

Stop the container when finished:

```bash
npm run mongo:down
# or: docker compose down
```

This publishes MongoDB on **127.0.0.1:27017** (default). Data persists in the named Docker volume `challenge-point-mongo-data`.

### Option B — MongoDB without Docker

Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) (or another supported build), run `mongod` so it listens on **27017**, and use the same connection string as above in `back/src/.env.development`.

Set `DB_CONNECTION_STRING` in **`back/src/.env.development`** (and in production env / `back/dist/.env.production` when applicable).

## Local development (Vite + nodemon)

Use this for day-to-day work: hot reload on both sides.

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Ensure MongoDB is running (Option A or B above).

3. Ensure **`back/src/.env.development`** includes a valid `DB_CONNECTION_STRING` and secrets (`JWT_SECRET`, `REFRESH_SECRET`, etc.).

4. Start app:

   ```bash
   npm run dev
   ```

**Typical URLs**

| Service    | URL                         | Notes                                      |
|------------|-----------------------------|--------------------------------------------|
| Frontend   | http://localhost:5173       | Vite dev server (port may differ if busy). |
| Backend API| http://localhost:3001       | `PORT` in `back/src/.env.development` (default **3001**). |
| API base   | http://localhost:3001/api   | Matches `VITE_API_URL` in `front/.env.development`. |

`SITE_URL` in **`back/src/.env.development`** should match the frontend origin you use in the browser (default **http://localhost:5173** for dev) for links and redirects.

## Local production-like run (bundled API + static frontend)

Use this to smoke-test the built stack (no Vite HMR).

1. Build:

   ```bash
   npm run build
   ```

2. Ensure MongoDB is running.

3. Start:

   ```bash
   npm start
   ```

**Typical URLs**

| Service    | URL                         | Notes |
|------------|-----------------------------|--------|
| Frontend   | http://localhost:4173       | `vite preview` default port. |
| Backend API| http://localhost:3001       | Same `PORT` as in env (e.g. `back/dist/.env.production`). |
| API base   | http://localhost:3001/api   | `VITE_API_URL` in **`front/.env.production`** should stay aligned. |

For this mode, **`SITE_URL`** in the backend env used at runtime (e.g. `back/dist/.env.production` or `back/env.production.template`) defaults to **http://localhost:4173** so server-generated links match `vite preview`. If you change the preview port, set `SITE_URL` and rebuild or override env accordingly.

## Individual commands

```bash
npm run dev:front
npm run dev:back
npm run build:front
npm run build:back
```

## Environment configuration

- **`back/src/.env.development`** — Backend: MongoDB, JWT, `SITE_URL`, `PORT`, optional email/S3, etc.
- **`front/.env.development`** — Frontend: `VITE_API_URL` must point at the API (e.g. `http://localhost:3001/api`).
- **`front/.env.production`** — Used for `vite build` / `vite preview`; public `VITE_*` vars only.

For production builds, either add **`back/src/.env.production`** or rely on **`back/env.production.template`** (copied into **`back/dist/.env.production`** when the src file is absent).

## Building for production (artifacts)

```bash
npm run build
```

Creates:

- **`front/dist/`** — Static frontend assets
- **`back/dist/`** — Bundled backend (`index.js` + copied assets)

## Deployment

The project is deployment-flexible:

### Frontend (`front/dist/`)

Deploy static assets to any hosting service (Netlify, Vercel, Cloudflare Pages, CDN, Nginx, etc.).

### Backend (`back/dist/`)

Deploy to any Node.js host with MongoDB access; run `node dist/index.js`.

**Deployment checklist**

1. Configure production environment variables
2. Build both frontend and backend
3. Deploy frontend static files
4. Deploy backend with MongoDB access
5. Point `VITE_API_URL` at the deployed API

## Project structure

```
├── docker-compose.yml   # Optional local MongoDB (Docker)
├── front/               # React frontend (Vite)
├── back/                # Express backend
│   └── src/
│       ├── models/      # Shared data models (imported by frontend)
│       └── routes/
│           └── _endpoints.ts  # Shared API endpoints
├── package.json         # Root scripts for the monorepo
```

**Note**: Models and endpoints are shared between frontend and backend via Vite aliases (`@/MODELS`, `@/ROUTES`).

## Development notes

- Backend uses nodemon with hot reload
- Frontend uses Vite HMR
- Shared TypeScript types across the stack
- ESLint and Prettier configured for code quality
