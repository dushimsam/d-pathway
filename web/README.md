# D-Pathway web

Next.js 16 + React 19 + Tailwind client for D-Pathway. One app, two roles:
graduates browse briefs, apply and deliver work; companies post briefs, review
candidates and pay winners. It talks to the API through a proxy and keeps the login
token in an httpOnly cookie, never in the browser.

## Requirements

Node 24+ · npm. The API must be running (see [`../api`](../api)).

## Setup

```bash
cp .env.example .env            # API_BASE_URL + Cloudinary cloud name
npm install --legacy-peer-deps
npm run dev                     # http://localhost:3000
```

Seeded logins (password `password123`): `orders@kigalitailors.rw` (company),
`graduate@alu.edu` (graduate).

## Layout

```
src/
├─ app/            routes, grouped by role
│   ├─ (graduate)/   dashboard · catalogue · saved · applications · profile · earnings
│   ├─ (company)/    projects · review board · talent · settings · wallet
│   ├─ api/          auth + BFF proxy (attaches the token to each call)
│   └─ ...           landing, login, register, public profiles
├─ components/     ui/ primitives (Button, Card, Field, …) + feature components
└─ lib/            API client, Zod schemas, query hooks, helpers
```

Reads and mutations use TanStack Query; forms use React Hook Form + Zod. Every list
screen has loading, empty and error states.
