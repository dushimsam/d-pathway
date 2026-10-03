# D-Pathway

> **Status:** foundation phase (demo). A running API with the `Pathway` model and
> CRUD, a web home page that lists published pathways, and PostgreSQL in Docker.
> Stages, enrolments, submissions, reviews, auth and uploads come in later phases.

## Description

D-Pathway is a web platform for the Kigali, Rwanda graduate labour market. A
company authors a **pathway** — an ordered ladder of stages describing exactly
how a graduate becomes hire-ready for that company — and graduates climb it.
This phase builds only the foundation: a NestJS API exposing the `Pathway`
model, a Next.js home page that shows published pathways, and a Dockerised
PostgreSQL database.

## Repository

<!-- TODO: add the public repository URL here -->

## Tech stack

- **API:** Node 24 LTS, NestJS 12 (ESM), TypeORM 0.3 + PostgreSQL 16, `@nestjs/config` + Joi, class-validator, Swagger. Vitest, oxlint.
- **Web:** Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4, IBM Plex Sans via `next/font`.
- **Infra:** PostgreSQL 16 in Docker Compose.

## Prerequisites

- Node 24 LTS
- Docker (for PostgreSQL)

## Setup

```bash
git clone <repo-url>
cd d-pathway

# 1. Database
docker compose up -d

# 2. API (http://localhost:3000)
cd api
npm ci
cp .env.example .env
npm run migration:run
npm run seed
npm run dev

# 3. Web (http://localhost:3001) — in a second terminal
cd web
npm ci
cp .env.example .env
npm run dev
```

## Designs

<!-- TODO: add Figma link and screenshots under docs/screenshots/ -->

## API documentation

Swagger UI: http://localhost:3000/docs

## Deployment plan

_(Planned, not implemented in this phase.)_ API run under pm2 behind Caddy on a
Strettch Cloud compute instance; PostgreSQL in Docker on the same host; GitHub
Actions deploying on push to `main`.

## Project structure

_(See the full tree in the project documentation.)_
