# Power, Pleasure, and Poison Reframing App

Next.js App Router MVP for managing the reframing/redraft of the book project.

## What It Does

- Dashboard table for the full B1-B55 book structure.
- Dedicated block pages with `Overview`, `Sources`, `Map`, and `Text` tabs.
- Supabase schema for sections, chapters, blocks, Zotero sources, block/source joins, map nodes/edges, drafts, notes, and sync runs.
- Server-only Zotero sync route at `POST /api/sync/zotero`.
- React Flow blackboard map with saved nodes and edges.
- Draft text editor with explicit save and revision count.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`.

Required for live Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vwixeanrtymkdhpybhbg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key, server only>
```

Required for Zotero sync:

```bash
ZOTERO_API_KEY=<zotero key>
ZOTERO_LIBRARY_ID=<numeric user or group library id>
ZOTERO_LIBRARY_TYPE=user
```

Optional write protection:

```bash
APP_ADMIN_TOKEN=<shared local admin token>
```

If `APP_ADMIN_TOKEN` is set, enter it in the write-token box in the app before saving drafts, saving maps, attaching sources, detaching sources, or syncing Zotero.

## Database

Apply:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed/001_reframing_blocks.sql`

The migration enables RLS on all public tables and grants read access to `anon`/`authenticated`. Mutations are intended to flow through Next.js server routes using `SUPABASE_SERVICE_ROLE_KEY`; do not expose service-role keys in browser env vars.

The seed is generated from:

```bash
../Thesis Redraft/Planning/Revised_Reframing.md
```

Regenerate it after planning-file edits:

```bash
npm run seed:generate
```

## Local Development

```bash
npm run dev
```

Without Supabase env vars, the dashboard and block overview pages use the generated local seed data. Source, map, and draft persistence require Supabase.

## AI Gateway

This project includes a server-side smoke endpoint at:

```bash
POST /api/ai-gateway/smoke
```

It uses the Vercel AI SDK with `provider/model` routing through AI Gateway. Configure one of:

```bash
AI_GATEWAY_API_KEY=<static gateway key>
VERCEL_OIDC_TOKEN=<from vercel env pull>
AI_GATEWAY_MODEL=openai/gpt-5.5
```

Local script:

```bash
npm run ai:smoke -- "Explain quantum computing in simple terms."
```

If using Vercel OIDC locally:

```bash
vercel link
vercel env pull .env.local
```

## Vercel

Set the same env vars in Vercel Project Settings. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser-exposed. Keep `SUPABASE_SERVICE_ROLE_KEY` and `ZOTERO_API_KEY` server-only.

Deploy:

```bash
vercel
```
