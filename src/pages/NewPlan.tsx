import { useRef, useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { parseGpx, type GpxSummary } from '../lib/gpx';
import { useWeather } from '../hooks/useWeather';

type Discipline = 'cycling' | 'running';
type EffortLevel = 'easy' | 'steady' | 'race_pace' | 'all_out';
type Caffeine = 'skip' | 'standard' | 'heavy';
type AidStations = 'none' | 'sparse' | 'frequent';
type PlanWindow = '24h' | '48h' | '72h';

type FormState = {
  raceName: string;
  raceDate: string;
  startTime: string;
  discipline: Discipline | '';
  gpxFile: File | null;
  distanceKm: string;
  elevationM: string;
  effortLevel: EffortLevel | '';
  targetFinishTime: string;
  aidStations: AidStations | '';
  planWindow: PlanWindow;
  carbsOverride: string;
  caffeine: Caffeine | '';
};

const EMPTY_FORM: FormState = {
  raceName: '',
  raceDate: '',
  startTime: '',
  discipline: '',
  gpxFile: null,
  distanceKm: '',
  elevationM: '',
  effortLevel: '',
  targetFinishTime: '',
  aidStations: '',
  planWindow: '72h',
  carbsOverride: '',
  caffeine: '',
};

const EFFORT_LABELS: Record<EffortLevel, string> = {
  easy: 'Easy',
  steady: 'Steady',
  race_pace: 'Race pace',
  all_out: 'All-out',
};

const AID_LABELS: Record<AidStations, string> = {
  none: 'None (self-supported)',
  sparse: 'Sparse',
  frequent: 'Frequent',
};

const WINDOW_LABELS: Record<PlanWindow, string> = {
  '24h': '24h before',
  '48h': '48h before',
  '72h': '72h before',
};

const CAFFEINE_LABELS: Record<Caffeine, string> = {
  skip: 'Skip',
  standard: 'Standard',
  heavy: 'Heavy',
};

const inputClass =
  'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30';

export default function NewPlan() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [gpxSummary, setGpxSummary] = useState<GpxSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onFilePick(file: File | null) {
    if (!file) {
      update('gpxFile', null);
      setGpxSummary(null);
      return;
    }
    update('gpxFile', file);
    try {
      const summary = await parseGpx(file);
      setGpxSummary(summary);
      update('distanceKm', String(summary.distanceKm));
      update('elevationM', String(summary.elevationGainM));
    } catch (err) {
      setGpxSummary(null);
      toast.error(err instanceof Error ? err.message : 'Could not read the GPX file.');
    }
  }

  function clearGpx() {
    update('gpxFile', null);
    setGpxSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success('Form looks good — plan generation comes next.');
  }

  return (
    <div>
      <PageHeader
        title="New plan"
        subtitle="A few questions about the race, the route, and your goals. We'll handle the rest."
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Section title="Race" subtitle="Where, when, and what.">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Race name" htmlFor="raceName" required>
              <input
                id="raceName"
                type="text"
                value={form.raceName}
                onChange={(e) => update('raceName', e.target.value)}
                className={inputClass}
                placeholder="e.g. Stuttgart Marathon"
                required
              />
            </Field>
            <Field label="Race date" htmlFor="raceDate" required>
              <input
                id="raceDate"
                type="date"
                value={form.raceDate}
                onChange={(e) => update('raceDate', e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Start time" htmlFor="startTime" hint="Local time at the start line.">
              <input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Discipline" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(['cycling', 'running'] as Discipline[]).map((d) => (
                <ChipButton
                  key={d}
                  active={form.discipline === d}
                  onClick={() => update('discipline', d)}
                >
                  {d === 'cycling' ? 'Cycling' : 'Running'}
                </ChipButton>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Route" subtitle="GPX is preferred — we'll extract distance and elevation.">
          <Field label="GPX file">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                className="sr-only"
                onChange={(e) => onFilePick(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12 M7 8l5-5 5 5 M5 21h14" />
                </svg>
                {form.gpxFile ? 'Change file' : 'Choose a GPX file'}
              </button>
              {form.gpxFile && (
                <span className="truncate text-sm text-zinc-600">{form.gpxFile.name}</span>
              )}
              {form.gpxFile && (
                <button
                  type="button"
                  onClick={clearGpx}
                  className="text-xs font-medium text-zinc-500 transition hover:text-rose-600"
                >
                  Remove
                </button>
              )}
            </div>
            {gpxSummary && (
              <p className="mt-2 text-xs text-zinc-500">
                {gpxSummary.pointCount.toLocaleString()} track points · start{' '}
                {gpxSummary.startLat.toFixed(4)}, {gpxSummary.startLng.toFixed(4)}
              </p>
            )}
          </Field>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field
              label="Distance (km)"
              htmlFor="distanceKm"
              hint="Auto-filled from GPX if uploaded."
            >
              <input
                id="distanceKm"
                type="number"
                min={0}
                step="0.1"
                value={form.distanceKm}
                onChange={(e) => update('distanceKm', e.target.value)}
                className={inputClass}
                placeholder="e.g. 42.2"
              />
            </Field>
            <Field
              label="Elevation gain (m)"
              htmlFor="elevationM"
              hint="Auto-filled from GPX if uploaded."
            >
              <input
                id="elevationM"
                type="number"
                min={0}
                value={form.elevationM}
                onChange={(e) => update('elevationM', e.target.value)}
                className={inputClass}
                placeholder="e.g. 450"
              />
            </Field>
          </div>

          {gpxSummary && form.raceDate && (
            <div className="mt-5">
              <WeatherCard
                lat={gpxSummary.startLat}
                lng={gpxSummary.startLng}
                date={form.raceDate}
              />
            </div>
          )}

          <Field label="Aid stations / refueling access" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(AID_LABELS) as [AidStations, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.aidStations === key}
                  onClick={() => update('aidStations', key)}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Goal" subtitle="How hard you'll go.">
          <Field label="Effort level">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EFFORT_LABELS) as [EffortLevel, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.effortLevel === key}
                  onClick={() => update('effortLevel', key)}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>

          <Field
            label="Target finish time"
            htmlFor="targetFinishTime"
            hint="Optional. Format: h:mm or hh:mm (e.g. 3:45)."
            className="mt-5"
          >
            <input
              id="targetFinishTime"
              type="text"
              inputMode="numeric"
              value={form.targetFinishTime}
              onChange={(e) => update('targetFinishTime', e.target.value)}
              className={`${inputClass} max-w-xs`}
              placeholder="e.g. 3:45"
            />
          </Field>
        </Section>

        <Section
          title="Plan options"
          subtitle="Overrides for this race only — your profile defaults still apply otherwise."
        >
          <Field label="Plan window">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(WINDOW_LABELS) as [PlanWindow, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.planWindow === key}
                  onClick={() => update('planWindow', key)}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field
              label="Carbs per hour override (g)"
              htmlFor="carbsOverride"
              hint="Leave blank to use your profile default."
            >
              <input
                id="carbsOverride"
                type="number"
                min={0}
                max={199}
                value={form.carbsOverride}
                onChange={(e) => update('carbsOverride', e.target.value)}
                className={inputClass}
                placeholder="e.g. 90"
              />
            </Field>
          </div>

          <Field label="Caffeine strategy" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CAFFEINE_LABELS) as [Caffeine, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.caffeine === key}
                  onClick={() => update('caffeine', key)}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/app/plans"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110"
          >
            Generate plan
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  className,
  required,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-amber-500 text-zinc-950 shadow-sm'
          : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
      }`}
    >
      {children}
    </button>
  );
}

function WeatherCard({
  lat,
  lng,
  date,
}: {
  lat: number;
  lng: number;
  date: string;
}) {
  const { data, isLoading, isError } = useWeather(lat, lng, date);

  if (isLoading) {
    return (
      <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        Looking up forecast…
      </div>
    );
  }

  if (isError || !data) return null;

  if (data.kind === 'out_of_range') {
    if (data.reason === 'past') return null;
    return (
      <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <span className="font-medium text-zinc-700">Forecast available closer to race day.</span>{' '}
        Race is {data.daysAway} days out — we'll fill this in nearer the date.
      </div>
    );
  }

  const f = data.data;
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(f.date));

  return (
    <div className="rounded-sm border border-amber-200 bg-amber-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
        Forecast · {formattedDate}
      </p>
      <p className="mt-1 text-sm text-zinc-800">
        {Math.round(f.tempMinC)}°–{Math.round(f.tempMaxC)}°C · {f.precipitationProbabilityPct}%
        rain · {Math.round(f.windSpeedMaxKmh)} km/h wind
      </p>
    </div>
  );
}
