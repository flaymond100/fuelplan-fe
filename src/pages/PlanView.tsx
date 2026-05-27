import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { usePlan } from '../hooks/usePlans';
import { formatDate } from '../lib/profileFormat';
import type { PlanItem, PlanPhase, PlanNutrientTotals, PlanRow } from '../types';

export default function PlanView() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading, isError } = usePlan(id);

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          Loading plan…
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Couldn't load this plan. It may not exist, or it isn't yours.
        </div>
      </div>
    );
  }

  const p = plan.plan_json;

  return (
    <div>
      <BackLink />
      <div className="mt-4">
        <PageHeader title={plan.race_name ?? 'Your plan'} subtitle={p.summary} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500">
        {plan.race_date && <span>{formatDate(plan.race_date)}</span>}
        {plan.distance_km != null && <span>{plan.distance_km} km</span>}
        {plan.elevation_m != null && <span>{plan.elevation_m} m climb</span>}
        <span>Est. {formatDuration(p.estimatedDurationMin)}</span>
      </div>

      {p.warnings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <ul className="space-y-1.5 text-sm text-amber-900">
            {p.warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <TotalTile label="Carbs" value={`${p.totals.carbsG} g`} />
        <TotalTile label="Fluids" value={`${p.totals.fluidsMl} ml`} />
        <TotalTile label="Sodium" value={`${p.totals.sodiumMg} mg`} />
        <TotalTile label="Caffeine" value={`${p.totals.caffeineMg} mg`} />
        <TotalTile label="Energy" value={`${p.totals.kcal} kcal`} />
      </div>

      <div className="mt-8 space-y-6">
        {p.phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, plan }: { phase: PlanPhase; plan: PlanRow }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 px-6 py-4">
        <h2 className="text-base font-semibold text-zinc-900">{phase.label}</h2>
        <p className="text-xs text-zinc-500">{nutrientLine(phase.totals)}</p>
      </header>
      <ul className="divide-y divide-zinc-100">
        {phase.items.map((item, i) => (
          <li key={i} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:gap-4">
            <div className="w-24 flex-shrink-0 text-sm font-medium text-amber-600">
              {itemTime(plan.race_date, plan.start_time, item.offsetMin, item.label)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-900">{item.what}</p>
              {nutrientLine(item) && (
                <p className="mt-0.5 text-xs text-zinc-500">{nutrientLine(item)}</p>
              )}
              {item.notes && <p className="mt-1 text-xs italic text-zinc-400">{item.notes}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TotalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/plans"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
      </svg>
      All plans
    </Link>
  );
}

function nutrientLine(n: PlanNutrientTotals | PlanItem): string {
  const parts: string[] = [];
  if (n.carbsG) parts.push(`${n.carbsG} g carbs`);
  if (n.fluidsMl) parts.push(`${n.fluidsMl} ml`);
  if (n.sodiumMg) parts.push(`${n.sodiumMg} mg Na`);
  if (n.caffeineMg) parts.push(`${n.caffeineMg} mg caffeine`);
  if (n.kcal) parts.push(`${n.kcal} kcal`);
  return parts.join(' · ');
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function itemTime(
  raceDate: string | null,
  startTime: string | null,
  offsetMin: number,
  label: string,
): string {
  if (!raceDate || !startTime) return label;
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date(`${raceDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return label;
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + offsetMin);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
