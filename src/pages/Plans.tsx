import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { Card, buttonClass } from '../components/ui';
import { usePlans } from '../hooks/usePlans';
import { formatDate } from '../lib/profileFormat';
import type { PlanRow } from '../types';

export default function Plans() {
  const { data: plans, isLoading, isError } = usePlans();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My plans"
        subtitle="Every plan you generate lives here."
        action={
          <Link to="/app/plans/new" className={buttonClass('primary')}>
            <PlusIcon /> New plan
          </Link>
        }
      />

      {isLoading ? (
        <Card className="p-12 text-center text-sm text-zinc-500">Loading…</Card>
      ) : isError ? (
        <Card className="p-6 text-sm text-rose-700 ring-rose-200">
          Couldn't load your plans. Refresh to try again.
        </Card>
      ) : !plans || plans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300/70 bg-white/40 p-12 text-center backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-zinc-900">No plans yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create your first one — your first plan is on us.
          </p>
          <Link to="/app/plans/new" className={buttonClass('primary', 'mt-5')}>
            <PlusIcon /> Create a plan
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
  );
}

function PlanRowCard({ plan }: { plan: PlanRow }) {
  const totals = plan.plan_json?.totals;
  const discipline = plan.request_params?.discipline;
  const meta = [
    plan.race_date && formatDate(plan.race_date),
    plan.distance_km != null && `${plan.distance_km} km`,
    plan.elevation_m != null && `${plan.elevation_m} m climb`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/app/plans/${plan.id}`}
      className="group flex items-center gap-4 rounded-3xl bg-white/60 p-5 ring-1 ring-white/70 shadow-[0_18px_50px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl transition hover:bg-white/80 hover:ring-white"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-400/15 text-brand-700">
        <DisciplineIcon discipline={discipline} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-zinc-900">{plan.race_name ?? 'Untitled plan'}</h3>
        {meta && <p className="mt-1 truncate text-sm text-zinc-500">{meta}</p>}
      </div>

      {totals && (
        <div className="hidden shrink-0 items-center gap-6 text-right sm:flex">
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {totals.kcal.toLocaleString()}
            <span className="ml-0.5 text-xs font-medium text-zinc-400">kcal</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {totals.carbsG.toLocaleString()}
            <span className="ml-0.5 text-xs font-medium text-zinc-400">g carbs</span>
          </span>
        </div>
      )}

      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
      >
        <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
      </svg>
    </Link>
  );
}

function DisciplineIcon({ discipline }: { discipline?: string }) {
  if (discipline === 'running') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="5" r="1.6" />
        <path d="m6 20 2.5-4.5L8 13l1-5 4 1.5 1.5 2.5L17 14M11 9l-3 1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14 M5 12h14" />
    </svg>
  );
}
