import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';

export default function Dashboard() {
  const { session } = useSession();
  const email = session?.user.email ?? '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[480px] overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-rose-600/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/app" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 shadow-lg shadow-amber-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
            </svg>
          </span>
          Fuelplan
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-50 truncate text-sm text-zinc-400 sm:inline" title={email}>
            {email}
          </span>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div>
          <p className="text-sm font-medium text-amber-400">Welcome back</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            Your plans, one click away.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            This is your dashboard. Create a new plan from a GPX route, or revisit one you've already generated.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <ActionCard
            disabled
            title="Create a plan"
            body="Upload a GPX, answer a few profile questions, get a personalised plan."
            cta="Coming next"
          />
          <EmptyCard
            title="Your plans"
            body="Plans you generate will appear here. Nothing yet — create your first one above."
          />
          <ActionCard
            disabled
            title="Profile"
            body="Weight, sweat rate, gut tolerance, dietary preferences. Save once, reuse on every plan."
            cta="Coming soon"
          />
        </div>
      </main>
    </div>
  );
}

function ActionCard({
  title,
  body,
  cta,
  disabled,
}: {
  title: string;
  body: string;
  cta: string;
  disabled?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      <button
        type="button"
        disabled={disabled}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
      >
        {cta}
      </button>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6">
      <h3 className="text-lg font-semibold text-zinc-300">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}
