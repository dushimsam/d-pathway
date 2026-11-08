# D-Pathway API

NestJS + PostgreSQL + TypeORM REST API for D-Pathway. Companies post paid project
briefs; graduates apply, submit work, and get scored 1–5, and the winner is paid
from an escrow wallet. The API owns every business rule.

## Requirements

Node 24+ · npm · Docker (for Postgres + Redis).

## Setup

```bash
cp .env.example .env
docker compose up -d        # Postgres + Redis
npm ci
npm run migration:run       # create the schema
npm run seed                # demo data
npm run dev                 # http://localhost:3001  (Swagger at /docs)
```

Seeded logins (password `password123`): `orders@kigalitailors.rw` (company),
`graduate@alu.edu` (graduate). Cloudinary, Stripe and Resend are optional locally —
without them, uploads, payments and email are off, but everything else runs.

## Layout

```
src/
├─ modules/        one folder per feature, each with:
│   └─ <name>/       controllers · services · entities · dto · rules
│                  auth · projects · wallet · applications · deliverables ·
│                  evaluations · talent · reviews · catalogue · activity ·
│                  mail · uploads · dashboards · health
├─ common/         BaseEntity, enums, guards, decorators, pagination
├─ config/         env validation (Joi) + config service
├─ database/       data source, migrations, seed
└─ redis/          BullMQ queue + cache
```

Each request flows: **guard** (JWT + role) → **controller** (validates the DTO) →
**service** (business rules) → **Postgres** (via TypeORM). Slow work like email runs
off the main path on a Redis/BullMQ worker, and money moves inside a DB transaction.
