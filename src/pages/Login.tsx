import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/authErrors';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status.kind === 'submitting') return;

    setStatus({ kind: 'submitting' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus({ kind: 'error', message: friendlyError(error.message) });
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
    if (error) {
      setGoogleLoading(false);
      setStatus({ kind: 'error', message: friendlyError(error.message) });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-rose-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <aside className="hidden flex-col justify-between p-12 lg:flex">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 shadow-lg shadow-amber-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </span>
            Fuelplan
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Welcome{' '}
              <span className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">
                back
              </span>
              .
            </h2>
            <p className="mt-6 text-zinc-400">
              Pick up where you left off — your plans, profiles, and past races are right where you saved them.
            </p>

            <ul className="mt-10 space-y-4 text-sm text-zinc-300">
              <Bullet>Jump straight back to your last plan</Bullet>
              <Bullet>Tweak your gut-tolerance profile any time</Bullet>
              <Bullet>Generate a new plan in under a minute</Bullet>
            </ul>
          </div>

          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Fuelplan</p>
        </aside>

        <main className="flex flex-col px-6 py-10 sm:px-12 lg:py-16">
          <Link to="/" className="mb-10 flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 shadow-lg shadow-amber-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </span>
            Fuelplan
          </Link>

          <div className="mx-auto w-full max-w-sm flex-1 lg:flex lg:flex-col lg:justify-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Sign in</h1>
            <p className="mt-3 text-zinc-400">
              New here?{' '}
              <Link to="/signup" className="font-medium text-amber-400 transition hover:text-amber-300">
                Create an account
              </Link>
            </p>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wider text-zinc-600">
              <div className="h-px flex-1 bg-zinc-800" />
              or with email
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/60 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-zinc-400 transition hover:text-amber-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 pr-12 text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {status.kind === 'error' && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <p>{status.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status.kind === 'submitting'}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 px-5 py-3 text-base font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status.kind === 'submitting' ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition group-hover:translate-x-0.5">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
      </span>
      {children}
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.89 0 3.15.8 3.87 1.48l2.64-2.54C16.84 3.36 14.66 2.4 12 2.4 6.81 2.4 2.6 6.61 2.6 11.8s4.21 9.4 9.4 9.4c5.43 0 9.02-3.81 9.02-9.17 0-.62-.07-1.09-.15-1.83H12Z" />
      <path fill="#34A853" d="M3.88 7.36 6.99 9.66c.86-1.7 2.5-2.86 5.01-2.86 1.53 0 2.92.55 4 1.45L18.43 5.7C16.66 4.07 14.43 3.1 12 3.1 8.16 3.1 4.86 5.16 3.88 7.36Z" opacity="0" />
      <path fill="#FBBC05" d="M12 21.2c2.59 0 4.77-.86 6.36-2.34l-3.02-2.4c-.83.57-1.92.94-3.34.94-2.58 0-4.77-1.7-5.56-4.06l-3.18 2.43C4.86 18.84 8.16 21.2 12 21.2Z" opacity="0" />
      <path fill="#4285F4" d="M21.02 12.03c0-.62-.07-1.09-.15-1.83H12v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1v.07l3.04 2.36c2.52-1.66 4.34-4.45 4.34-8.6 0-.62-.07-1.09-.15-1.83Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
