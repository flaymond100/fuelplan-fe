# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (http://localhost:5173)
pnpm build        # tsc -b && vite build → dist/
pnpm lint         # eslint
pnpm preview      # serve dist/ locally
```

No test runner is configured yet.

## Architecture

See `ARCHITECTURE.md` for the full stack picture and `PLAN.md` for the phased implementation roadmap.

This is the **frontend** half of FuelPlan. The backend lives at `/Users/prln255/fuelplan-be`.

### Data flow

- All reads go directly from the browser to Supabase (anon key, RLS-enforced) via TanStack Query.
- The **only** route that hits the Express backend (`VITE_API_URL`) is plan generation and Stripe checkout — everything else is Supabase-direct.
- JWT is attached to backend requests manually as `Authorization: Bearer <token>` (retrieved from `supabase.auth.getSession()`).

### Key conventions

- **Types**: snake_case interfaces for DB rows (suffix `Row`), camelCase for mapped domain types. Mappers live in `src/lib/`.
- **Auth gate**: wrap protected routes in `<RequireAuth>` from `src/components/RequireAuth.tsx`. It checks the Supabase session and redirects to `/login` if absent.
- **Styling**: Tailwind v4 — import via `@import "tailwindcss"` in `index.css`, no config file needed. The Tailwind Vite plugin is used (not PostCSS).
- **Toasts**: `react-hot-toast` with a single `<Toaster>` in `App.tsx`. Success toasts on user-visible actions; errors shown inline.
- **Queries**: TanStack Query v5 — one `QueryClient` in `App.tsx`, data fetched with `useQuery` / `useMutation` in page components or custom hooks under `src/lib/`.

### Access control (subscription tiers)

The backend `checkAccess` middleware is the gate — never gate on the frontend alone. Tiers: Free (1 plan/month), Pro (unlimited, `status=active`), Pay-per-plan (`credits > 0`). State lives in `subscriptions` and `plan_credits` tables.
