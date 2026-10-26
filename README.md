# D-Pathway

A web platform for the Kigali, Rwanda graduate labour market. Companies post
bounded **projects** drawn from real internal problems; graduates browse the
catalogue, accept IP terms and **apply**; companies accept or decline; accepted
graduates submit one **deliverable** before a deadline; companies record one
immutable **evaluation** per deliverable (score, feedback, outcome) and invite
the strongest to interview. The first company on the platform is Strettch Cloud.

The pilot is academic: five graduates and three companies in Kigali over thirty
days. Out of scope by design: payments, notifications, chat, native mobile, team
deliverables, resubmission after evaluation, and any AI scoring.

## Monorepo

| Path | Stack | What it is |
|---|---|---|
| [`api/`](./api) | NestJS 12 · PostgreSQL 16 · TypeORM · Node 24 (ESM) | REST API at `/api/v1`, the authority for every business rule |
| [`web/`](./web) | Next.js 16 · React 19 · Tailwind CSS 4 · TanStack Query | Role-aware client for graduates and companies |

Each has its own README with setup, structure, and conventions.

## Run it locally

```bash
# 1. API + database
cd api
cp .env.example .env
docker compose up -d          # Postgres 16 on 127.0.0.1:5432
npm ci
npm run migration:run
npm run seed                  # 3 companies, 1 graduate, sample projects
npm run start:dev             # API on :3001, Swagger at /docs

# 2. Web (new shell)
cd ../web
cp .env.example .env          # API_BASE_URL=http://localhost:3001/api/v1
npm install --legacy-peer-deps
npm run dev                   # http://localhost:3000
```

Seeded logins (password `password123`): `cto@strettch.com` (company),
`graduate@alu.edu` (graduate).

## Architecture notes

- **The server is the authority.** Every business rule lives in a service or a
  pure rule function in `api/` with a unit test; a violation returns `409` with
  the rule's own sentence. The client mirrors rules only for UX.
- **Auth.** JWT (HS256, 24h) issued by the API. The web app keeps it in an
  httpOnly cookie and reaches the API through a same-origin BFF proxy that
  injects the bearer token — no token ever touches the browser.
- **Files.** Deliverable files upload straight from the browser to Cloudinary
  using signed params from `POST /uploads/sign`; the API stores only the URL and
  public id. All personal data stays on the Kigali host (Rwanda Law No. 058/2021).
- **Deployment.** One Strettch Cloud compute in Kigali: the API under pm2 on
  Node 24, Postgres in Docker, Caddy for TLS, GitHub Actions for CI and SSH
  deploy. See `api/README.md` and the workflows in `.github/workflows/`.

## CI

- `.github/workflows/api-ci.yml` — lint, typecheck, build, `migration:run`
  against a throwaway Postgres, and Vitest; SSH-deploys on `main`.
- `.github/workflows/web-ci.yml` — typecheck and build.
