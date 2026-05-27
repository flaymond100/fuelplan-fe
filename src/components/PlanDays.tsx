import { useMemo, useState } from 'react';
import type {
  AlertSeverity,
  MacroTone,
  PlanAlert,
  PlanItem,
  PlanJson,
  PlanNutrientTotals,
  PlanPhase,
  PlanRow,
} from '../types';

const RACE_DAY_PHASES = new Set(['pre_race_morning', 'race', 'recovery']);

interface DayTab {
  key: string;
  label: string;
  phases: PlanPhase[];
}

function buildDays(phases: PlanPhase[]): DayTab[] {
  const days: DayTab[] = [];
  const raceDay: PlanPhase[] = [];
  for (const ph of phases) {
    if (RACE_DAY_PHASES.has(ph.id)) raceDay.push(ph);
    else days.push({ key: ph.id, label: ph.label, phases: [ph] });
  }
  if (raceDay.length) days.push({ key: 'race_day', label: 'Race Day', phases: raceDay });
  return days;
}

function sumTotals(phases: PlanPhase[]): PlanNutrientTotals {
  return phases.reduce<PlanNutrientTotals>(
    (acc, ph) => ({
      carbsG: acc.carbsG + ph.totals.carbsG,
      fluidsMl: acc.fluidsMl + ph.totals.fluidsMl,
      sodiumMg: acc.sodiumMg + ph.totals.sodiumMg,
      caffeineMg: acc.caffeineMg + ph.totals.caffeineMg,
      kcal: acc.kcal + ph.totals.kcal,
    }),
    { carbsG: 0, fluidsMl: 0, sodiumMg: 0, caffeineMg: 0, kcal: 0 },
  );
}

const MACRO_TONE: Record<MacroTone, string> = {
  default: 'bg-zinc-100 text-zinc-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
};

const ALERT_TONE: Record<AlertSeverity, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
};

function itemTime(raceDate: string | null, startTime: string | null, offsetMin: number, label: string): string {
  if (!raceDate || !startTime) return label;
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date(`${raceDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return label;
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + offsetMin);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

function nutrientLine(it: PlanItem): string {
  const parts: string[] = [];
  if (it.carbsG) parts.push(`${it.carbsG} g carbs`);
  if (it.proteinG) parts.push(`${it.proteinG} g protein`);
  if (it.fatG) parts.push(`${it.fatG} g fat`);
  if (it.fluidsMl) parts.push(`${it.fluidsMl} ml`);
  if (it.sodiumMg) parts.push(`${it.sodiumMg} mg Na`);
  if (it.caffeineMg) parts.push(`${it.caffeineMg} mg caffeine`);
  if (it.kcal) parts.push(`${it.kcal} kcal`);
  return parts.join(' · ');
}

function macroChips(phases: PlanPhase[]): { label: string; tone: MacroTone }[] {
  const authored = phases.flatMap((ph) => ph.macros ?? []);
  if (authored.length) return authored.map((m) => ({ label: m.label, tone: m.tone ?? 'default' }));
  const t = sumTotals(phases);
  const chips: { label: string; tone: MacroTone }[] = [];
  if (t.carbsG) chips.push({ label: `${t.carbsG} g carbs`, tone: 'default' });
  if (t.fluidsMl) chips.push({ label: `${t.fluidsMl} ml fluids`, tone: 'default' });
  if (t.sodiumMg) chips.push({ label: `${t.sodiumMg} mg sodium`, tone: 'default' });
  if (t.caffeineMg) chips.push({ label: `${t.caffeineMg} mg caffeine`, tone: 'default' });
  if (t.kcal) chips.push({ label: `${t.kcal} kcal`, tone: 'default' });
  return chips;
}

interface Props {
  plan: PlanRow;
}

export default function PlanDays({ plan }: Props) {
  const p: PlanJson = plan.plan_json;
  const days = useMemo(() => buildDays(p.phases), [p.phases]);
  const [active, setActive] = useState(0);

  const hasExplicitKinds = useMemo(
    () => p.phases.some((ph) => ph.items.some((it) => it.kind)),
    [p.phases],
  );

  const alerts: PlanAlert[] = useMemo(() => {
    if (p.alerts?.length) return p.alerts;
    return p.warnings.map((w) => ({ severity: 'warning' as const, title: 'Heads up', body: w }));
  }, [p.alerts, p.warnings]);

  if (days.length === 0) return null;
  const day = days[Math.min(active, days.length - 1)];

  const dayItems = day.phases
    .flatMap((ph) => ph.items)
    .slice()
    .sort((a, b) => a.offsetMin - b.offsetMin);

  const mealItems = dayItems.filter((it) =>
    it.kind ? it.kind === 'meal' || it.kind === 'snack' || it.kind === 'hydration' : true,
  );
  const supplementItems = dayItems.filter((it) => it.kind === 'supplement');
  const fuelItems = dayItems.filter((it) => it.kind === 'fuel');
  const chips = macroChips(day.phases);

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {days.map((d, i) => (
          <button
            key={d.key}
            onClick={() => setActive(i)}
            className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold transition ${
              i === active
                ? 'border-zinc-200 bg-white text-amber-500'
                : 'border-transparent bg-zinc-50 text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Day card */}
      <div className="rounded-b-xl rounded-tr-xl border border-zinc-200 bg-white p-5 sm:p-6">
        {/* Day header */}
        <div className="border-b border-zinc-100 pb-4">
          <h2 className="text-xl font-bold text-zinc-900">{day.label}</h2>
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span key={i} className={`rounded-full px-3 py-1 text-xs font-semibold ${MACRO_TONE[c.tone]}`}>
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        {dayItems.length > 0 && (
          <Section title="Timeline">
            <ol className="relative ml-1.5 border-l-2 border-zinc-200 pl-5">
              {dayItems.map((it, i) => {
                const isStart = it.offsetMin === 0;
                return (
                  <li key={i} className="relative mb-4 last:mb-0">
                    <span
                      className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                        isStart ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                    />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                      {itemTime(plan.race_date, plan.start_time, it.offsetMin, it.label)}
                    </p>
                    <p className={`mt-0.5 text-sm font-semibold ${isStart ? 'text-rose-600' : 'text-zinc-800'}`}>
                      {it.label}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">{it.what}</p>
                  </li>
                );
              })}
            </ol>
          </Section>
        )}

        {/* Meals */}
        {mealItems.length > 0 && (
          <Section title="Meals">
            <div className="space-y-2">
              {mealItems.map((it, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{it.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {itemTime(plan.race_date, plan.start_time, it.offsetMin, it.label)}
                      </p>
                    </div>
                    {it.carbsG > 0 && (
                      <span className="whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                        {it.carbsG}g carbs
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{it.what}</p>
                  {nutrientLine(it) && <p className="mt-1 text-xs text-zinc-400">{nutrientLine(it)}</p>}
                  {it.notes && (
                    <p className="mt-2 border-t border-zinc-200 pt-2 text-xs italic text-amber-600">{it.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Supplements */}
        {hasExplicitKinds && supplementItems.length > 0 && (
          <Section title="Supplements">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {supplementItems.map((it, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                  <p className="text-sm font-bold text-zinc-900">{it.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{it.detail ?? it.what}</p>
                  <p className="mt-1.5 text-xs font-semibold text-amber-600">
                    {itemTime(plan.race_date, plan.start_time, it.offsetMin, it.label)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* In-race gel / fuel table */}
        {hasExplicitKinds && fuelItems.length > 0 && (
          <Section title="In-race fuelling">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 text-left text-[11px] uppercase tracking-wide text-amber-700">
                    <th className="px-3 py-2 font-semibold">Time</th>
                    <th className="px-3 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold">Carbs</th>
                    <th className="px-3 py-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelItems.map((it, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="px-3 py-2 font-medium text-zinc-700">
                        {itemTime(plan.race_date, plan.start_time, it.offsetMin, it.label)}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{it.what}</td>
                      <td className="px-3 py-2 font-bold text-amber-600">{it.carbsG}g</td>
                      <td className="px-3 py-2 text-zinc-500">{it.notes ?? it.detail ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>

      {/* Plan-wide alerts (always visible across tabs) */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-xl border p-3.5 text-sm ${ALERT_TONE[a.severity]}`}>
              <p className="font-bold">{a.title}</p>
              <p className="mt-0.5 leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400">{title}</p>
      {children}
    </div>
  );
}
