import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useSession } from '../hooks/useSession';

export default function Dashboard() {
  const { session } = useSession();
  const email = session?.user.email ?? '';
  const firstName = email.split('@')[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
        subtitle="Your plans, profile, and subscription — one click away."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <PrimaryCard
          to="/app/plans/new"
          title="Create a plan"
          body="Upload a GPX, answer a few questions, get a personalised race-day plan."
        />
        <SecondaryCard
          to="/app/plans"
          title="My plans"
          body="Plans you've generated. Nothing yet — your first plan is on us."
        />
        <SecondaryCard
          to="/app/profile"
          title="Profile"
          body="Weight, sweat rate, gut tolerance. Save once, reuse on every plan."
        />
      </div>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Recent plans</h2>
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">
            No plans yet.{' '}
            <Link to="/app/plans/new" className="font-medium text-amber-600 hover:text-amber-700">
              Create your first one →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function PrimaryCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-6 text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-105"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-900/80">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
        Start
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition group-hover:translate-x-0.5">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </span>
    </Link>
  );
}

function SecondaryCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-amber-600 group-hover:text-amber-700">
        Open
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition group-hover:translate-x-0.5">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </span>
    </Link>
  );
}
