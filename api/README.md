# D-Pathway API

NestJS 12 + PostgreSQL 16 + TypeORM REST API for the D-Pathway project platform
(the Kigali graduate labour market). Companies post bounded **projects**;
graduates browse the catalogue, accept IP terms and **apply**; companies accept
or decline; accepted graduates submit one **deliverable**; companies record one
immutable **evaluation** per deliverable and invite the strongest to interview.

ESM throughout (`"type": "module"`), Node 24, `strict` TypeScript.

## Quick start (local)

```bash
cp .env.example .env            # fill JWT_SECRET and CLOUDINARY_* for real use
docker compose up -d            # Postgres 16 on 127.0.0.1:5432
npm ci
npm run migration:run           # create the schema
npm run seed                    # 3 companies, 1 graduate, sample projects
npm run start:dev               # http://localhost:3001, Swagger at /docs
```

`GET /api/v1/health` returns `{ "status": "ok", "db": "ok" }`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | watch-mode dev server |
| `npm run build` / `start:prod` | compile to `dist/` and run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | oxlint |
| `npm test` | Vitest (business-rule unit tests) |
| `npm run migration:generate -- src/database/migrations/<Name>` | generate a migration from entity changes |
| `npm run migration:run` / `migration:revert` | apply / revert migrations |
| `npm run seed` | idempotent pilot seed |

## Layout

- `src/config` — `@nestjs/config` + Joi schema; boot fails fast on bad env.
- `src/database` — TypeORM data source (CLI), `DatabaseModule`, migrations, seed.
- `src/common` — base entity, enums, guards (`JwtAuthGuard`, `RolesGuard`),
  `@CurrentUser`/`@Roles`/`@Public` decorators, the exception filter, pagination.
- `src/modules/<name>` — `health`, `auth`, `graduates`, `companies`, `projects`,
  `catalogue`, `applications`, `deliverables`, `evaluations`, `uploads`,
  `dashboards`. Each has `controllers/`, `services/`, `entities/`, `dto/`, plus
  `rules/` for pure business-rule functions. Cross-module calls go through
  exported services; writes never reach another module's repository.

## Business rules

Every rule in `references/business-rules.md` is a pure function under a module's
`rules/` folder with a unit test, and a violation returns `409 Conflict` whose
message is the rule's own sentence. The load-bearing ones: terms before applying
(A2), no acceptance after the application deadline (A3), one application per
(project, graduate) (A4, unique index), deliverable only for an accepted
application before the submission deadline (D1–D2), and one immutable evaluation
per deliverable (E3, unique index on `deliverable_id`).

## Deployment

One Strettch Cloud compute in Kigali. The API runs under **pm2**
(`pm2 start ecosystem.config.cjs`) directly on Node 24 — never containerised.
**Postgres runs in Docker** from `docker-compose.yml` (persistent volume,
localhost only). **Caddy** reverse-proxies with automatic TLS (`Caddyfile`).
**GitHub Actions** (`.github/workflows/api-ci.yml`) runs lint, typecheck, build,
`migration:run` against a throwaway Postgres, and tests; on `main` it SSH-deploys.
All personal data stays on the Kigali host (Rwanda Law No. 058/2021); Cloudinary
holds only deliverable files via signed uploads.
