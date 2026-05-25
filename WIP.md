# fuelplan (frontend) — Work In Progress

> Per-repo session state. Read first on session start. Update last on session end.
> Cross-repo coordination goes in `../fuelplan-shared/WIP.md` instead.

## Done this session

- **Landing page** at `/` ([src/pages/Landing.tsx](src/pages/Landing.tsx)). Dark theme, amber/orange gradient accents. Sections: hero with primary CTA, 3 feature cards, 3-step "how it works", final CTA, footer. Replaces the "FuelPlan — coming soon" placeholder in [src/App.tsx](src/App.tsx).
- **Sign-up page** at `/signup` ([src/pages/SignUp.tsx](src/pages/SignUp.tsx)). Two-column layout (brand panel + form). Email + password via `supabase.auth.signUp` plus "Continue with Google" via `signInWithOAuth`. Show/hide password toggle, inline error messages mapped via `friendlyError()`, "Check your inbox" success state when email confirmation is on, auto-redirect to `/` when a session returns immediately.
- **Login page** at `/login` ([src/pages/Login.tsx](src/pages/Login.tsx)). Mirrors the SignUp layout (two-column, brand-panel left, form right) but with "Welcome back" copy and a different bullet list. Email + password via `supabase.auth.signInWithPassword`, "Continue with Google" via `signInWithOAuth`, show/hide toggle, "Forgot password?" link (route doesn't exist yet — see below), redirects to `/` on success.
- **Auth error helper extracted** to [src/lib/authErrors.ts](src/lib/authErrors.ts). Now shared between SignUp and Login. Added login-specific cases: "invalid login credentials" → friendly mismatch message, "email not confirmed" → prompt to check inbox.
- **Route registered**: `/login` added in [src/App.tsx](src/App.tsx). `tsc --noEmit` clean, `vite build` clean.
- **Session-aware Landing header** ([src/pages/Landing.tsx](src/pages/Landing.tsx)). Shows the user's email + a "Sign out" button when authenticated; otherwise shows "Sign in" + "Sign Up". The Sign out button calls `supabase.auth.signOut()` and the `onAuthStateChange` listener in [src/hooks/useSession.ts](src/hooks/useSession.ts) flips the UI back. Gives the user a visible signal that login worked, until a real Dashboard exists.
- **`useSession()` hook** at [src/hooks/useSession.ts](src/hooks/useSession.ts). Single source of truth for the Supabase session — used by Landing and by [src/components/RequireAuth.tsx](src/components/RequireAuth.tsx) (which now delegates to it instead of duplicating `getSession` + `onAuthStateChange`). Returns `{ session, loading }`; `loading` is true on the initial undefined state.
- **`/app` Dashboard scaffold** at [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx). Authenticated entrypoint with welcome header, email + Sign out, and three placeholder cards: "Create a plan" (disabled, coming next), "Your plans" (empty state), "Profile" (disabled). Matches the Landing visual language (dark + amber accents).
- **App shell with sidebar nav** at [src/components/AppLayout.tsx](src/components/AppLayout.tsx). Dark sidebar (zinc-950 + amber accents — brand-consistent with Landing) on the left, light content area (zinc-50 + white cards) on the right. Sidebar has: brand logo top, nav items middle (Dashboard, New plan, My plans, Profile, Subscription, Settings — each with an inline-SVG icon and `NavLink` active styling via `bg-amber-500/10 text-amber-300`), user avatar + email + Sign out pinned bottom. Mobile: sidebar slides offscreen, slim top bar with hamburger appears, backdrop click + nav-click both auto-close. Desktop (`lg:`): sidebar is fixed at 256px width, top bar hides.
- **Nested `/app` routes** in [src/App.tsx](src/App.tsx). `/app` is now a layout route (wrapped in `RequireAuth` → `AppLayout`) with child routes: `index` (Dashboard), `plans` ([Plans.tsx](src/pages/Plans.tsx)), `plans/new` ([NewPlan.tsx](src/pages/NewPlan.tsx)), `profile` ([Profile.tsx](src/pages/Profile.tsx)), `subscription` ([Subscription.tsx](src/pages/Subscription.tsx)), `settings` ([Settings.tsx](src/pages/Settings.tsx)). All non-Dashboard pages render a [ComingSoon](src/components/ComingSoon.tsx) card under a shared [PageHeader](src/components/PageHeader.tsx) — every nav link resolves so the skeleton feels alive.
- **Dashboard refactored** for the new light-content area. Strips its own header (AppLayout owns chrome now). Three cards: primary "Create a plan" (amber gradient → `/app/plans/new`), secondary "My plans" and "Profile" (white cards). Below: "Recent plans" empty state with CTA to `/app/plans/new`.
- **Route guards** in [src/App.tsx](src/App.tsx). `/app` is wrapped in [RequireAuth](src/components/RequireAuth.tsx); `/login` and `/signup` are wrapped in the new [PublicOnlyRoute](src/components/PublicOnlyRoute.tsx) so already-signed-in users get bounced to `/app` if they revisit the auth pages.
- **Post-auth redirects all target `/app`**. SignUp's email-confirmation `emailRedirectTo`, SignUp's Google OAuth `redirectTo`, SignUp's immediate-session navigate, Login's password success, and Login's Google OAuth all land on `/app`. Login also honors `location.state.from` (passed by RequireAuth when bouncing unauthenticated deep links), so a user who hits e.g. `/app/plans/123` while logged out gets sent to `/login` then bounced back to `/app/plans/123`.
- **Landing logged-in CTA**: when a session exists, the Landing header now shows email + "Go to app" (primary button) + "Sign out" — gives a logged-in visitor an obvious path into the product.
- **Env wired up**: [.env](.env) now has real `VITE_SUPABASE_URL` (project ref `v`) and `VITE_SUPABASE_ANON_KEY` (verified via JWT decode — `role: anon`). Confirmed `.env` is in `.gitignore`.

Nothing committed yet — slices are ready to commit when you want them.

## Next up

- **Flesh out the placeholder pages**. [NewPlan](src/pages/NewPlan.tsx) (GPX upload + profile form + plan generation) is the biggest piece. [Profile](src/pages/Profile.tsx) (weight, sweat rate, gut tolerance, dietary prefs) is next biggest. [Subscription](src/pages/Subscription.tsx) needs Stripe wiring from the backend.
- **Forgot password flow** — the Login page links to `/forgot-password`, which 404s. Needs a page that calls `supabase.auth.resetPasswordForEmail()` plus a `/auth/reset-password` page where the redirect lands and calls `updateUser({ password })`. Wrap both in `PublicOnlyRoute`.
- **Supabase redirect allowlist update** — when adding the production domain, allowlist `/app` (not just `/`) so OAuth and email-confirmation redirects don't bounce.
- **OAuth callback handling** — Supabase parses the URL hash on `onAuthStateChange`, but we should confirm the redirect to `/app` lands cleanly and consider an explicit `/auth/callback` route if we ever want a loading state during exchange.
- **404 / unmatched route** — no catch-all `<Route path="*">` yet; deep-linking to a typo'd route renders nothing. Add a NotFound page when convenient.

## Blocked / waiting on

- **Google OAuth in Supabase dashboard** — must be enabled at Authentication → Providers → Google before the Google button works end-to-end. User action required, not a code change.
- **Redirect URLs allowlist** — add `http://localhost:5173/app` (dev) and `https://<prod-domain>/app` to Authentication → URL Configuration → Redirect URLs in the Supabase dashboard, or email-confirmation links and OAuth returns will fail.
- **No browser verification** — Landing, SignUp, Login, Dashboard, and the AppLayout sidebar shell all pass `tsc` + `vite build`, but I haven't loaded them in a browser. Visual confirmation pending — especially the mobile sidebar slide-in and the active NavLink styling.

## Mid-edit files

> Ideally none — finish a slice, commit, then stop.

- (none — both pages are self-contained slices)

## Notes for next session

- `friendlyError()` is now in [src/lib/authErrors.ts](src/lib/authErrors.ts) — extend it there when new auth pages (forgot-password, reset-password) need messages.
- Landing page uses inline `<svg>` icons rather than pulling in `lucide-react` or similar. Keep that choice unless we end up with >10 icons across the app — then revisit. SignUp, Login, and AppLayout each define icon helpers locally. Counting: Dashboard/Plus/List/User/Card/Gear/Menu/Close (AppLayout) + Google/Eye/EyeOff/Spinner (SignUp/Login) + Bullet (SignUp/Login/Landing) — we're already at ~13 icons. Worth extracting to `src/components/icons.tsx` next time we add one.
- `CLAUDE.md`'s folder structure lists `SignIn.jsx`, `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`; we use `Login.tsx`, `RequireAuth.tsx`, `PublicOnlyRoute.tsx` (TS, "RequireAuth" reads more declaratively at call sites). Update CLAUDE.md if we care about the alignment.
- **Subdomain split deferred** — discussed splitting to `app.fuelplan.com` vs `fuelplan.com`. Chose to defer: single-domain with `/app` prefix gives the same partition without the second deploy / cross-subdomain auth config. Migration to a subdomain split later is mechanical because URLs already partition cleanly.
