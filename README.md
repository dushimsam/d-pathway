# D-Pathway

A web platform connecting Kigali-based graduates with companies and community organisations through real-world projects that help graduates demonstrate their skills and earn interview opportunities.

📄 **[Technical Report (PDF)](https://drive.google.com/file/d/1Vhu0t3mNvAq2R8jNUVhVfqxT1qyo4S5u/view?usp=sharing)** — scope alignment, technical functionality, testing approaches & results, and code-quality practices.

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
npm run seed                  # 3 organisations, 1 graduate, sample projects
npm run start:dev             # API on :3001, Swagger at /docs

# 2. Web (new shell)
cd ../web
cp .env.example .env          # API_BASE_URL=http://localhost:3001/api/v1
npm install --legacy-peer-deps
npm run dev                   # http://localhost:3000
```

Seeded logins (password `password123`): `orders@kigalitailors.rw` (company),
`graduate@alu.edu` (graduate).