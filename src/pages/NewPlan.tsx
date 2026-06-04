import { useRef, useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import GeneratingOverlay from '../components/GeneratingOverlay';
import { parseGpx, type GpxSummary } from '../lib/gpx';
import { useWeather } from '../hooks/useWeather';
import { api, errorStatus } from '../lib/api';
import type { PlanRow } from '../types';

type Discipline = 'cycling' | 'running';
type EffortLevel = 'easy' | 'steady' | 'race_pace' | 'all_out';
type Caffeine = 'skip' | 'standard' | 'heavy';
type AidStations = 'none' | 'sparse' | 'frequent';
type PlanWindow = '24h' | '48h' | '72h';

type TrainingNotes = { minus1: string; minus2: string; minus3: string };

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
  trainingNotes: TrainingNotes;
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
  trainingNotes: { minus1: '', minus2: '', minus3: '' },
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
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [gpxSummary, setGpxSummary] = useState<GpxSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Same query key as the WeatherCard below → one fetch, shared cache.
  const weatherQuery = useWeather(
    gpxSummary?.startLat ?? null,
    gpxSummary?.startLng ?? null,
    form.raceDate,
  );

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

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    if (!form.gpxFile || !gpxSummary) {
      toast.error('Upload a GPX file to generate a plan.');
      return;
    }
    if (form.targetFinishTime && !/^\d{1,2}:\d{2}$/.test(form.targetFinishTime)) {
      toast.error('Target finish time must be h:mm (e.g. 3:45).');
      return;
    }

    const weather =
      weatherQuery.data?.kind === 'forecast'
        ? {
            tempMaxC: weatherQuery.data.data.tempMaxC,
            tempMinC: weatherQuery.data.data.tempMinC,
            precipitationProbabilityPct: weatherQuery.data.data.precipitationProbabilityPct,
            windSpeedMaxKmh: weatherQuery.data.data.windSpeedMaxKmh,
            weatherCode: weatherQuery.data.data.weatherCode,
          }
        : null;

    const payload = {
      raceName: form.raceName,
      raceDate: form.raceDate,
      startTime: form.startTime || null,
      discipline: form.discipline || null,
      distanceKm: form.distanceKm ? Number(form.distanceKm) : gpxSummary.distanceKm,
      elevationGainM: form.elevationM ? Number(form.elevationM) : gpxSummary.elevationGainM,
      effortLevel: form.effortLevel || null,
      targetFinishTime: form.targetFinishTime || null,
      aidStations: form.aidStations || null,
      planWindow: form.planWindow,
      carbsOverride: form.carbsOverride ? Number(form.carbsOverride) : null,
      caffeine: form.caffeine || null,
      weather,
      trainingNotes: {
        ...(form.trainingNotes?.minus3?.trim() && { minus3: form.trainingNotes.minus3.trim() }),
        ...(form.trainingNotes?.minus2?.trim() && { minus2: form.trainingNotes.minus2.trim() }),
        ...(form.trainingNotes?.minus1?.trim() && { minus1: form.trainingNotes.minus1.trim() }),
      },
      gpx: {
        startLat: gpxSummary.startLat,
        startLng: gpxSummary.startLng,
        pointCount: gpxSummary.pointCount,
      },
    };

    const fd = new FormData();
    fd.append('gpxFile', form.gpxFile);
    fd.append('payload', JSON.stringify(payload));

    setSubmitting(true);
    try {
      const { planId } = await api.postForm<{ planId: string; plan: PlanRow }>(
        '/api/plans/generate',
        fd,
      );
      toast.success('Plan ready!');
      navigate(`/app/plans/${planId}`);
    } catch (err) {
      console.log(err)
      const status = errorStatus(err);
      if (status === 402 || status === 403) {
        toast.error('Plan limit reached — check your subscription or credits.');
      } else if (status === 504) {
        toast.error('Generation timed out. Please try again.');
      } else {
        toast.error('Could not generate the plan. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      {submitting && <GeneratingOverlay />}
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

        <TrainingContextSection
          planWindow={form.planWindow}
          raceDate={form.raceDate}
          notes={form.trainingNotes}
          onChange={(notes) => update('trainingNotes', notes)}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          {submitting && (
            <span className="mr-auto text-sm text-zinc-500">This can take up to 2 minutes…</span>
          )}
          <Link
            to="/app/plans"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              'Generate plan'
            )}
          </button>
        </div>
      </form>
    </div>
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

const WINDOW_SLOTS: Record<PlanWindow, Array<{ key: keyof TrainingNotes; daysOut: number }>> = {
  '72h': [{ key: 'minus3', daysOut: 3 }, { key: 'minus2', daysOut: 2 }, { key: 'minus1', daysOut: 1 }],
  '48h': [{ key: 'minus2', daysOut: 2 }, { key: 'minus1', daysOut: 1 }],
  '24h': [{ key: 'minus1', daysOut: 1 }],
};

const PLACEHOLDERS: Record<keyof TrainingNotes, string> = {
  minus3: 'e.g. 2h zone 2 ride at 200W — or "rest day"',
  minus2: 'e.g. 45 min easy run, keep HR below 140',
  minus1: 'e.g. 20 min activation spin, high cadence, then rest',
};

function slotLabel(daysOut: number, raceDate: string): string {
  const suffix = daysOut === 1 ? 'day' : 'days';
  if (!raceDate) return `${daysOut} ${suffix} before race`;
  const d = new Date(`${raceDate}T12:00:00`);
  if (isNaN(d.getTime())) return `${daysOut} ${suffix} before race`;
  d.setDate(d.getDate() - daysOut);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${weekday} ${date} — ${daysOut} ${suffix} before`;
}

function TrainingContextSection({
  planWindow,
  raceDate,
  notes,
  onChange,
}: {
  planWindow: PlanWindow;
  raceDate: string;
  notes: TrainingNotes;
  onChange: (n: TrainingNotes) => void;
}) {
  const slots = WINDOW_SLOTS[planWindow];
  return (
    <Section
      title="Planned training in the lead-up"
      subtitle="Optional — what are you planning to do each day before the race? The AI will factor this into fatigue, carb loading, and pacing."
    >
      <div className="space-y-4">
        {slots.map(({ key, daysOut }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-zinc-500">
              {slotLabel(daysOut, raceDate)}
            </label>
            <textarea
              rows={2}
              value={notes[key]}
              onChange={(e) => onChange({ ...notes, [key]: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder={PLACEHOLDERS[key]}
            />
          </div>
        ))}
      </div>
    </Section>
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
