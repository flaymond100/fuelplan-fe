import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useSession } from '../hooks/useSession';
import { useProfile } from '../hooks/useProfile';
import { useLatestPlan } from '../hooks/usePlans';
import { formatDate } from '../lib/profileFormat';
import type { PlanRow } from '../types';

export default function Dashboard() {
  const { session } = useSession();
  const { data: profile } = useProfile();
  const { data: latestPlan, isLoading: planLoading } = useLatestPlan();
  const email = session?.user.email ?? '';
  const firstName = profile?.full_name?.split(' ')[0] || email.split('@')[0];

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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Latest plan</h2>
          {latestPlan && (
            <Link to="/app/plans" className="text-sm font-medium text-amber-600 hover:text-amber-700">
              All plans →
            </Link>
          )}
        </div>

        {planLoading ? (
          <div className="mt-4 rounded-sm border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading…
          </div>
        ) : latestPlan ? (
          <LatestPlanCard plan={latestPlan} />
        ) : (
          <div className="mt-4 rounded-sm border border-dashed border-zinc-200 bg-white p-10 text-center">
            <p className="text-sm text-zinc-500">
              No plans yet.{' '}
              <Link to="/app/plans/new" className="font-medium text-amber-600 hover:text-amber-700">
                Create your first one →
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function LatestPlanCard({ plan }: { plan: PlanRow }) {
  const totals = plan.plan_json?.totals;
  return (
    <Link
      to={`/app/plans/${plan.id}`}
      className="group mt-4 block rounded-sm border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-zinc-900">
            {plan.race_name ?? 'Untitled plan'}
          </h3>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-zinc-500">
            {plan.race_date && <span>{formatDate(plan.race_date)}</span>}
            {plan.distance_km != null && <span>{plan.distance_km} km</span>}
            {plan.elevation_m != null && <span>{plan.elevation_m} m climb</span>}
          </p>
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 flex-shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500"
        >
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </div>

      {plan.plan_json?.summary && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{plan.plan_json.summary}</p>
      )}

      {totals && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
          <span><span className="font-semibold text-zinc-900">{totals.carbsG}</span> g carbs</span>
          <span><span className="font-semibold text-zinc-900">{totals.fluidsMl}</span> ml fluid</span>
          <span><span className="font-semibold text-zinc-900">{totals.sodiumMg}</span> mg Na</span>
          <span><span className="font-semibold text-zinc-900">{totals.kcal}</span> kcal</span>
        </div>
      )}
    </Link>
  );
}

function PrimaryCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-sm bg-gradient-to-br from-amber-400 to-orange-600 p-6 text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-105"
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
      className="group rounded-sm border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
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
