# fuelplan (frontend) — Work In Progress

> Per-repo session state. Read first on session start. Update last on session end.
> Cross-repo coordination goes in `../fuelplan-shared/WIP.md` instead.

## Done this session

- **Landing page** at `/` ([src/pages/Landing.tsx](src/pages/Landing.tsx)). Dark theme, amber/orange gradient accents. Sections: hero with primary CTA, 3 feature cards, 3-step "how it works", final CTA, footer. Replaces the "FuelPlan — coming soon" placeholder in [src/App.tsx](src/App.tsx).
- **Sign-up page** at `/signup` ([src/pages/SignUp.tsx](src/pages/SignUp.tsx)). Two-column layout (brand panel + form). Email + password via `supabase.auth.signUp` plus "Continue with Google" via `signInWithOAuth`. Show/hide password toggle, inline error messages mapped via `friendlyError()`, "Check your inbox" success state when email confirmation is on, auto-redirect to `/` when a session returns immediately.
- **Env wired up**: [.env](.env) now has real `VITE_SUPABASE_URL` (project ref `v`) and `VITE_SUPABASE_ANON_KEY` (verified via JWT decode — `role: anon`). Confirmed `.env` is in `.gitignore`.

Nothing committed yet — slices are ready to commit when you want them.

## Next up

- **`/login` page** — the "Already have an account? Sign in" link in SignUp points to `/login`, which 404s. Build it next so the sign-up flow is complete.
- **Post-auth route** — after Google OAuth or email confirmation, users land on `/`, which is the public landing. Need a `Dashboard.jsx` (or similar) and a `ProtectedRoute` wrapper so authenticated users skip the marketing page.
- **OAuth callback handling** — Supabase parses the URL hash on `onAuthStateChange`, but we should confirm the redirect lands cleanly and consider an explicit `/auth/callback` route if we ever want a loading state during exchange.

## Blocked / waiting on

- **Google OAuth in Supabase dashboard** — must be enabled at Authentication → Providers → Google before the Google button works end-to-end. User action required, not a code change.
- **Redirect URLs allowlist** — add `http://localhost:5173` (dev) and the production domain to Authentication → URL Configuration → Redirect URLs in the Supabase dashboard, or email-confirmation links and OAuth returns will fail.
- **No browser verification** — Landing and SignUp pass `tsc` + `vite build`, but I haven't loaded them in a browser. Visual confirmation pending.

## Mid-edit files

> Ideally none — finish a slice, commit, then stop.

- (none — both pages are self-contained slices)

## Notes for next session

- The `friendlyError()` mapping in SignUp.tsx is intentionally local. If we add it to Login too, extract to `src/lib/authErrors.ts` instead of duplicating.
- Landing page uses inline `<svg>` icons rather than pulling in `lucide-react` or similar. Keep that choice unless we end up with >10 icons across the app — then revisit.
- `src/pages/SignIn.jsx` is the name referenced in `CLAUDE.md`'s folder structure, but we used `SignUp.tsx` (TS, and "SignUp" reads more clearly for the registration page). When building the login page, name it `Login.tsx` to match the `/login` route, and update CLAUDE.md if we care about the alignment.
