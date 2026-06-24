import { Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const { session } = useSession();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-brand-500/30 selection:text-brand-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-linear-to-br from-brand-500/25 via-brand-600/15 to-rose-600/10 blur-3xl" />
        <div className="absolute right-[-160px] top-[80px] h-[360px] w-[420px] rounded-full bg-linear-to-br from-fuchsia-500/10 to-brand-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-brand-300 to-brand-600 text-zinc-950 shadow-lg shadow-brand-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
            </svg>
          </span>
          Fuelplan
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
        </nav>
        {session ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-50 truncate text-sm text-zinc-400 sm:inline" title={session.user.email ?? ''}>
              {session.user.email}
            </span>
            <Link
              to="/app"
              className="rounded-full bg-brand-400 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-brand-500/30 transition hover:shadow-brand-400/50 hover:brightness-110"
            >
              Go to app
            </Link>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-brand-400 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-brand-500/30 transition hover:shadow-brand-400/50 hover:brightness-110"
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-28 md:pt-24 md:pb-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
              Your race-day fuel,{' '}
              <span className="bg-linear-to-br from-brand-300 via-brand-400 to-brand-600 bg-clip-text text-transparent">
                dialled in.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Upload your GPX route, tell us about you, and get a personalised
              24–72h nutrition plan engineered for your effort, your stomach, and your finish line.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-400 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-xl shadow-brand-500/30 transition hover:shadow-brand-400/50 hover:brightness-110"
              >
                Sign Up
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition group-hover:translate-x-0.5">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-7 py-3.5 text-base font-semibold text-zinc-200 backdrop-blur transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-zinc-500">No credit card required · Your first plan is free</p>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-28">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Route-aware"
              body="We read your GPX — elevation, distance, surface — and match calories and carbs to the real effort, not a generic curve."
              icon={
                <path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7Z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
              }
            />
            <FeatureCard
              title="Personalised to you"
              body="Body weight, sweat rate, gut tolerance, dietary preferences. Your plan is yours — not a copy of someone faster."
              icon={
                <path d="M12 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z M4 21a8 8 0 0 1 16 0" />
              }
            />
            <FeatureCard
              title="Race-day ready"
              body="Hour-by-hour breakdown for the 72 hours before the gun, the race itself, and recovery. Printable, mobile-friendly."
              icon={
                <path d="M12 2v3 M12 19v3 M4.93 4.93l2.12 2.12 M16.95 16.95l2.12 2.12 M2 12h3 M19 12h3 M4.93 19.07l2.12-2.12 M16.95 7.05l2.12-2.12 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              }
            />
          </div>
        </section>

        <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-950/50 py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Three steps. A plan you'd trust at the start line.
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                From GPX file to fuelling strategy in under two minutes.
              </p>
            </div>
            <div className="mt-16 grid gap-10 md:grid-cols-3">
              <Step
                n="01"
                title="Upload your route"
                body="Drop in a GPX from Strava, Komoot, Garmin — anywhere. We'll parse the climbs, the distance and the time you'll be moving."
              />
              <Step
                n="02"
                title="Tell us about you"
                body="A short profile: weight, target pace, what your gut handles, what you can't stomach mid-race. Two minutes, tops."
              />
              <Step
                n="03"
                title="Get your plan"
                body="A clear timeline — pre-race meals, on-bike or in-pocket fuelling, hydration cues, recovery. Save it, print it, race it."
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-4xl px-6 py-28">
          <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-10 md:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Ready for your next race?
              </h2>
              <p className="mt-4 max-w-xl text-lg text-zinc-400">
                Join athletes who stopped guessing at the aid station. Your first plan is on us.
              </p>
              <div className="mt-8">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-400 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-xl shadow-brand-500/30 transition hover:shadow-brand-400/50 hover:brightness-110"
                >
                  Sign Up
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition group-hover:translate-x-0.5">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 md:flex-row">
          <p>© {new Date().getFullYear()} Fuelplan. Fuel smarter.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition hover:text-zinc-300">Privacy</a>
            <a href="#" className="transition hover:text-zinc-300">Terms</a>
            <a href="#" className="transition hover:text-zinc-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900/40 p-7 backdrop-blur transition hover:border-brand-500/30 hover:bg-zinc-900/70">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-sm bg-linear-to-br from-brand-400/20 to-brand-600/10 text-brand-300 ring-1 ring-inset ring-brand-500/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative">
      <div className="text-sm font-mono font-semibold text-brand-400">{n}</div>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
