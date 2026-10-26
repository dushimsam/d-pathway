# D-Pathway web

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 client for D-Pathway. Two
roles, one app: **graduates** browse the catalogue, accept IP terms, apply and
submit a deliverable; **companies** post projects, review applicants and record
one evaluation per deliverable. The client talks only to the D-Pathway REST API
and mirrors its rules for good UX — the server stays the authority.

## Quick start

```bash
cp .env.example .env            # set API_BASE_URL + Cloudinary cloud name
npm install --legacy-peer-deps  # optional peers in @hookform/resolvers
npm run dev                     # http://localhost:3000
```

The API must be running (see `../api`). Seeded logins (password `password123`):
`cto@strettch.com` (company), `graduate@alu.edu` (graduate).

## How auth works

The JWT lives in an **httpOnly cookie** set by a Next route handler after login —
never in localStorage, never readable by the browser.

- `app/api/auth/{login,register/*,logout}` — call the API, set/clear the cookie.
- `app/api/v1/[...path]` — a same-origin **BFF proxy**: client components call
  `/api/v1/*`; the proxy reads the cookie and attaches `Authorization: Bearer`
  before forwarding to the real API. So `lib/api-client.ts` never handles a token.
- `src/proxy.ts` (Next 16 proxy convention, formerly `middleware.ts`) reads the
  cookie, resolves the role via `/auth/me`, and keeps graduates out of company
  routes and vice versa; unauthenticated requests go to `/login`.

## Structure

- `app/(graduate)` — dashboard, catalogue, project page + apply, deliverable submit.
- `app/(company)` — projects (home + dashboard), project builder, review queue,
  evaluation. Route groups enforce the role via each group's server layout.
- `components/ui` — design-system primitives (Button, Input, Textarea, Select,
  Field, Badge, Card, NavItem, StatusPill, DeadlineChip, States) built from the
  tokens in `app/globals.css` (`@theme`).
- `lib` — `api-client` (client → proxy), `server-api` (server → real API),
  `schemas` (Zod, mirroring the backend DTOs), `cloudinary` (signed direct
  upload), `types`.

## Data fetching

TanStack Query v5 for every read and mutation; React Hook Form + Zod for forms.
Query keys: `['catalogue', filters]`, `['project', id]`, `['applications','mine']`,
`['project', id, 'applications']`, `['deliverable', appId]`,
`['evaluation', deliverableId]`, `['dashboard', role]`. Mutations invalidate the
narrowest key.

## Conventions

- Every list screen has loading, empty and error states; no screen renders raw
  `undefined`.
- The client mirrors server rules for UX (terms gate the apply button, submit is
  disabled after the deadline, the evaluation form is read-only once recorded)
  but always handles the server's `409` and shows its message.
- Files upload straight to Cloudinary with signed params; the API only ever sees
  the resulting URL and public id.
- Design tokens only — no hard-coded hex or ad-hoc spacing.
