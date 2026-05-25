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
- **Route guards** in [src/App.tsx](src/App.tsx). `/app` is wrapped in [RequireAuth](src/components/RequireAuth.tsx); `/login` and `/signup` are wrapped in the new [PublicOnlyRoute](src/components/PublicOnlyRoute.tsx) so already-signed-in users get bounced to `/app` if they revisit the auth pages.
- **Post-auth redirects all target `/app`**. SignUp's email-confirmation `emailRedirectTo`, SignUp's Google OAuth `redirectTo`, SignUp's immediate-session navigate, Login's password success, and Login's Google OAuth all land on `/app`. Login also honors `location.state.from` (passed by RequireAuth when bouncing unauthenticated deep links), so a user who hits e.g. `/app/plans/123` while logged out gets sent to `/login` then bounced back to `/app/plans/123`.
- **Landing logged-in CTA**: when a session exists, the Landing header now shows email + "Go to app" (primary button) + "Sign out" — gives a logged-in visitor an obvious path into the product.
- **Env wired up**: [.env](.env) now has real `VITE_SUPABASE_URL` (project ref `v`) and `VITE_SUPABASE_ANON_KEY` (verified via JWT decode — `role: anon`). Confirmed `.env` is in `.gitignore`.

Nothing committed yet — slices are ready to commit when you want them.

## Next up

- **Wire the Dashboard "Create a plan" CTA** — currently disabled. Needs `/app/plans/new` page with GPX upload + profile form.
- **Forgot password flow** — the Login page links to `/forgot-password`, which 404s. Needs a page that calls `supabase.auth.resetPasswordForEmail()` plus a `/auth/reset-password` page where the redirect lands and calls `updateUser({ password })`. Wrap both in `PublicOnlyRoute`.
- **Supabase redirect allowlist update** — when adding the production domain, allowlist `/app` (not just `/`) so OAuth and email-confirmation redirects don't bounce.
- **OAuth callback handling** — Supabase parses the URL hash on `onAuthStateChange`, but we should confirm the redirect to `/app` lands cleanly and consider an explicit `/auth/callback` route if we ever want a loading state during exchange.
- **404 / unmatched route** — no catch-all `<Route path="*">` yet; deep-linking to a typo'd route renders nothing. Add a NotFound page when convenient.

## Blocked / waiting on

- **Google OAuth in Supabase dashboard** — must be enabled at Authentication → Providers → Google before the Google button works end-to-end. User action required, not a code change.
- **Redirect URLs allowlist** — add `http://localhost:5173/app` (dev) and `https://<prod-domain>/app` to Authentication → URL Configuration → Redirect URLs in the Supabase dashboard, or email-confirmation links and OAuth returns will fail.
- **No browser verification** — Landing, SignUp, Login, and Dashboard all pass `tsc` + `vite build`, but I haven't loaded them in a browser. Visual confirmation pending.

## Mid-edit files

> Ideally none — finish a slice, commit, then stop.

- (none — both pages are self-contained slices)

## Notes for next session

- `friendlyError()` is now in [src/lib/authErrors.ts](src/lib/authErrors.ts) — extend it there when new auth pages (forgot-password, reset-password) need messages.
- Landing page uses inline `<svg>` icons rather than pulling in `lucide-react` or similar. Keep that choice unless we end up with >10 icons across the app — then revisit. SignUp and Login each duplicate the GoogleIcon / EyeIcon / EyeOffIcon / Spinner / Bullet helpers locally — fine for two pages, but if a third auth page (forgot-password) needs the same icons, extract to `src/components/icons.tsx`.
- `CLAUDE.md`'s folder structure lists `SignIn.jsx`, `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`; we use `Login.tsx`, `RequireAuth.tsx`, `PublicOnlyRoute.tsx` (TS, "RequireAuth" reads more declaratively at call sites). Update CLAUDE.md if we care about the alignment.
- **Subdomain split deferred** — discussed splitting to `app.fuelplan.com` vs `fuelplan.com`. Chose to defer: single-domain with `/app` prefix gives the same partition without the second deploy / cross-subdomain auth config. Migration to a subdomain split later is mechanical because URLs already partition cleanly.
