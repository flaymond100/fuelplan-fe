import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { usePlans } from '../hooks/usePlans';
import { formatDate } from '../lib/profileFormat';
import type { PlanRow } from '../types';

export default function Plans() {
  const { data: plans, isLoading, isError } = usePlans();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="My plans" subtitle="Every plan you generate lives here." />
        <Link
          to="/app/plans/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110"
        >
          New plan
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading…
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            Couldn't load your plans. Refresh to try again.
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">No plans yet</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Create your first one — your first plan is on us.
            </p>
            <Link
              to="/app/plans/new"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110"
            >
              Create a plan
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li key={plan.id}>
                <PlanRowCard plan={plan} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PlanRowCard({ plan }: { plan: PlanRow }) {
  return (
    <Link
      to={`/app/plans/${plan.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-zinc-900">{plan.race_name ?? 'Untitled plan'}</h3>
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
    </Link>
  );
}
