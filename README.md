# Odisha Event Alert (OEA)

A full-stack event discovery platform for Odisha. It **auto-scans the web daily**
for upcoming events across Odisha's cities, publishes them to the public site,
and gives admins a control room to curate everything.

## Architecture

- **Next.js 16** (App Router) deployed on **Vercel**
- **Supabase Postgres** via Prisma (`@prisma/adapter-pg`) — persistent storage
  that works on serverless (the old bundled SQLite file could not persist writes)
- **Auto-Scan Engine** (`src/lib/scanner.ts`) — scans Google Events (SerpApi)
  for happenings across Bhubaneswar, Cuttack, Puri and the rest of Odisha,
  normalizes city/category/date, dedupes by slug, publishes new finds, and
  auto-expires past events
- **Vercel Cron** (`vercel.json`) hits `/api/cron/auto-scan` daily at 03:00 IST;
  admins can also hit **Scan Now** in the dashboard
- **Admin panel** at `/admin` — stats, full events CRUD, the Auto-Scan radar
  (scan history + discovered events), submissions review, leads

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres **transaction pooler** string (port 6543), using the `oea_app` role |
| `SERPAPI_KEY` | SerpApi key for the auto-scan engine (free tier at serpapi.com; scans are skipped without it) |
| `SCAN_QUERIES` | Optional comma-separated override of the scan search queries |
| `CRON_SECRET` | Protects the cron endpoint (Vercel sends it automatically) |
| `JWT_SECRET` | Signs admin session tokens |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run db:seed    # optional: reset + reseed the database
```

Admin login: `/admin/login` (see seed script for the default account — change
the password in production).
