# GYMHUNG

Gym management application built with React, TypeScript, Vite, ASP.NET Core and SQL Server.

Features include members, trainers, staff, membership packages, schedules, bookings, check-in, cash payments, receipts, reporting, permissions and profile photo upload. Refunds and membership lifecycle extensions are under development. Online payment and AI providers are demonstrations unless separately configured.

## Frontend

Requires Node.js 22.13 or later.

```sh
cd frontend
npm ci
npm run dev -- --host localhost --port 3107
```

Copy `.env.example` to `.env.local`. Use `VITE_API_BASE_URL=http://localhost:5042`. Set `VITE_USE_MOCK=true` for browser-only demonstration data or `false` for the SQL backend.

## Backend

Requires .NET 10 SDK and SQL Server. See `backend/README.md` and `docs/PRODUCTION-SETUP.md`. Configure `ConnectionStrings__GymDatabase`, `Jwt__Key`, issuer/audience and CORS before starting the API. Private configuration, user uploads and database backups are intentionally excluded.

The database schema export in `database/GYMHUNG_schema.sql` contains structure only, without live account data. Initialize your own accounts before using SQL mode. `backend/refunds.sql` adds the refund workflow extension. Source code contains documented demonstration credentials only; never reuse development credentials or signing keys for a public deployment.

## Checks

```sh
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

See `docs/COMPLETION-AUDIT.md` for tested flows and remaining limitations. Do not run verification utilities against a production database.
