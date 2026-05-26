# fuelplan (frontend) — Agent CLAUDE.md

Stack-specific context for the frontend agent. You work in this repo (`fuelplan/`) only.

> **First:** read `../fuelplan-shared/CLAUDE.md` for cross-cutting orientation and hard rules. They apply here too — this file doesn't repeat them.

## Stack

- React 18 + Vite
- Supabase JS SDK (`@supabase/supabase-js`) for auth + DB reads
- Stripe.js (`@stripe/stripe-js`) for checkout redirects only — never handle card data directly
- React Router for routing
- Plain CSS modules or Tailwind (pick one early — see `../fuelplan-shared/decisions/`)
- Deployed to GitHub Pages via Actions

## Folder structure

```
fuelplan/
├── public/
│   └── 404.html              # GitHub Pages SPA fallback — see "Routing gotcha"
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Singleton Supabase client
│   │   └── api.js            # Wrapper around fetch() that auto-attaches JWT
│   ├── hooks/
│   │   ├── useAuth.js        # Current session + user
│   │   └── useSubscription.js
│   ├── routes/
│   │   ├── ProtectedRoute.jsx
│   │   └── PublicOnlyRoute.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── SignIn.jsx
│   │   ├── Dashboard.jsx
│   │   ├── NewPlan.jsx       # GPX upload + form
│   │   ├── Plan.jsx          # Plan viewer
│   │   └── Pricing.jsx
│   ├── components/
│   ├── App.jsx
│   └── main.jsx
├── .claude/
│   └── skills/               # Frontend-specific patterns
├── CLAUDE.md                 # This file
├── WIP.md                    # Session handoff
├── .env                      # local only — gitignored
└── vite.config.js
```

## Hard rules — frontend-specific

(In addition to the cross-cutting rules in `../fuelplan-shared/CLAUDE.md`.)

1. **Only `VITE_*` env vars are accessible from frontend code.** Anything else is undefined at runtime.
2. **Never reference `SUPABASE_SERVICE_ROLE_KEY` anywhere.** If you ever feel you need to, stop — the answer is a backend route, not a workaround.
3. **All writes to `plans` go through backend routes**, not the Supabase client. `profiles` is the explicit exception — its writes go FE→Supabase direct under RLS + DB CHECK constraints (see [decision 0002](../fuelplan-shared/decisions/0002-profile-writes-direct.md)). For everything else the supabase client is for auth + reads only.
4. **`subscriptions` and `plan_credits` are read-only from the frontend.** Display them, never mutate.
5. **No `dangerouslySetInnerHTML`** on anything derived from user input or AI output, ever. The plan JSON renders into structured components.
6. **No `localStorage` for auth tokens.** Supabase SDK handles session storage — don't second-guess it.

## Patterns

### Supabase client (singleton)
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Auth state (hook)
```js
// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}
```

### Calling the backend
Always use the `api` wrapper from `.claude/skills/api-client/`. It auto-attaches the JWT and unifies error handling. Never call `fetch()` directly to our API.

## Routing gotcha — GitHub Pages

GitHub Pages returns 404 on hard refresh for any route other than `/`. Two fixes, both required:

1. **`public/404.html`** redirects back to the app — see `../fuelplan-shared/architecture.md` for the snippet.
2. **`vite.config.js`** — if deploying under a repo subdirectory, set `base: '/repo-name/'`. With a custom domain at root, omit `base`. We're using a custom domain — leave `base` unset unless that changes.

## Common mistakes to avoid

- **Stripe price IDs hardcoded in frontend.** Don't. Backend picks the right price based on a product key. Prices change; rebuilding the frontend each time is bad.
- **Calling Supabase directly to check subscription status.** RLS lets you read your own row, but the source of truth for "can this user generate a plan" is the backend `/api/can-generate` endpoint.
- **Building protected routes with `useEffect` redirects.** Use the `ProtectedRoute` wrapper component — see `protected-route` skill. `useEffect` redirects flash protected content for one frame.
- **Importing `recharts`/`d3`/big libs without checking bundle size.** GitHub Pages serves the bundle to athletes on phones in race week. Stay lean.

## Skills available

- `.claude/skills/api-client/` — the `api.js` wrapper, JWT handling, error shape
- `.claude/skills/protected-route/` — auth-gated routing pattern
- `.claude/skills/stripe-checkout/` — checkout button → backend session → redirect flow

Read the relevant `SKILL.md` before implementing.

## Build & deploy

- `npm run dev` — local dev
- `npm run build` — produces `dist/`
- GitHub Actions auto-deploys on push to `main` (see `../fuelplan-shared/architecture.md` for the workflow)
- All `VITE_*` env vars must be set as GitHub Secrets — listed in `architecture.md`
