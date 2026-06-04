import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { api, errorStatus } from '../lib/api';
import { useStravaStatus, useInvalidateStravaStatus } from '../hooks/useStravaStatus';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import { profileQueryKey, useProfile } from '../hooks/useProfile';
import {
  FUEL_FORM_LABELS,
  RESTRICTION_LABELS,
  formatPace,
  parsePace,
} from '../lib/profileFormat';
import type {
  CaffeineTolerance,
  Diet,
  Discipline,
  FuelForm,
  ProfileRow,
  Restriction,
  Sex,
  SweatRate,
} from '../types';

type FormState = {
  fullName: string;
  weightKg: string;
  birthDate: string;
  sex: Sex | '';
  heightCm: string;
  disciplines: Set<Discipline>;
  ftpWatts: string;
  runningThresholdText: string;
  maxHr: string;
  weeklyTrainingHours: string;
  sweatRate: SweatRate | '';
  maxCarbsGHr: string;
  caffeineTolerance: CaffeineTolerance | '';
  fuelForms: Set<FuelForm>;
  diet: Diet | '';
  restrictions: Set<Restriction>;
  restrictionsOther: string;
  avoidNotes: string;
  supplements: string;
};

const EMPTY_FORM: FormState = {
  fullName: '',
  weightKg: '',
  birthDate: '',
  sex: '',
  heightCm: '',
  disciplines: new Set(),
  ftpWatts: '',
  runningThresholdText: '',
  maxHr: '',
  weeklyTrainingHours: '',
  sweatRate: '',
  maxCarbsGHr: '',
  caffeineTolerance: '',
  fuelForms: new Set(),
  diet: '',
  restrictions: new Set(),
  restrictionsOther: '',
  avoidNotes: '',
  supplements: '',
};

const inputClass =
  'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30';

function rowToForm(row: ProfileRow): FormState {
  return {
    fullName: row.full_name ?? '',
    weightKg: row.weight_kg != null ? String(row.weight_kg) : '',
    birthDate: row.birth_date ?? '',
    sex: row.sex ?? '',
    heightCm: row.height_cm != null ? String(row.height_cm) : '',
    disciplines: new Set(row.disciplines ?? []),
    ftpWatts: row.ftp_watts != null ? String(row.ftp_watts) : '',
    runningThresholdText: formatPace(row.running_threshold_sec_per_km),
    maxHr: row.max_hr != null ? String(row.max_hr) : '',
    weeklyTrainingHours: row.weekly_training_hours != null ? String(row.weekly_training_hours) : '',
    sweatRate: row.sweat_rate ?? '',
    maxCarbsGHr: row.max_carbs_g_hr != null ? String(row.max_carbs_g_hr) : '',
    caffeineTolerance: row.caffeine_tolerance ?? '',
    fuelForms: new Set(row.fuel_forms ?? []),
    diet: row.diet ?? '',
    restrictions: new Set(row.restrictions ?? []),
    restrictionsOther: row.restrictions_other ?? '',
    avoidNotes: row.avoid_notes ?? '',
    supplements: (row.supplements ?? []).join(', '),
  };
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function ProfileEdit() {
  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Edit profile" />
        <div className="mt-8 rounded-sm border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          Loading…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Edit profile" />
        <div className="mt-8 rounded-sm border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Could not load your profile. Refresh to try again.
        </div>
      </div>
    );
  }

  return <ProfileEditForm initial={profile ?? null} />;
}

function ProfileEditForm({ initial }: { initial: ProfileRow | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user.id;
  const [form, setForm] = useState<FormState>(() => (initial ? rowToForm(initial) : EMPTY_FORM));
  const hasHydratedFromInitial = useRef<boolean>(!!initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial || hasHydratedFromInitial.current) return;
    setForm(rowToForm(initial));
    hasHydratedFromInitial.current = true;
  }, [initial]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !userId) return;

    if (form.runningThresholdText && parsePace(form.runningThresholdText) === null) {
      toast.error('Running threshold must be in mm:ss format (e.g. 4:30).');
      return;
    }

    setSaving(true);
    const update = {
      full_name: form.fullName || null,
      weight_kg: form.weightKg ? Number(form.weightKg) : null,
      birth_date: form.birthDate || null,
      sex: form.sex || null,
      height_cm: form.heightCm ? Number(form.heightCm) : null,
      disciplines: Array.from(form.disciplines),
      ftp_watts: form.ftpWatts ? Number(form.ftpWatts) : null,
      running_threshold_sec_per_km: parsePace(form.runningThresholdText),
      max_hr: form.maxHr ? Number(form.maxHr) : null,
      weekly_training_hours: form.weeklyTrainingHours ? Number(form.weeklyTrainingHours) : null,
      sweat_rate: form.sweatRate || null,
      max_carbs_g_hr: form.maxCarbsGHr ? Number(form.maxCarbsGHr) : null,
      caffeine_tolerance: form.caffeineTolerance || null,
      fuel_forms: Array.from(form.fuelForms),
      diet: form.diet || null,
      restrictions: Array.from(form.restrictions),
      restrictions_other: form.restrictionsOther || null,
      avoid_notes: form.avoidNotes || null,
      supplements: form.supplements
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const { error } = await supabase.from('profiles').update(update).eq('id', userId);
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not save profile. Please try again.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
    toast.success('Profile saved');
    navigate('/app/profile');
  }

  const showCycling = form.disciplines.has('cycling');
  // const showRunning = form.disciplines.has('running');

  return (
    <div>
      <Link
        to="/app/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Back to profile
      </Link>
      <div className="mt-4">
        <PageHeader
          title="Edit profile"
          subtitle="Body, training, fuelling, and dietary preferences. Save once, reuse on every plan."
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Section title="About you" subtitle="Identity and body.">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Full name" htmlFor="fullName">
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </Field>
            <Field label="Date of birth" htmlFor="birthDate">
              <input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Sex" htmlFor="sex">
              <select
                id="sex"
                value={form.sex}
                onChange={(e) => update('sex', e.target.value as FormState['sex'])}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </Field>
            <Field label="Weight (kg)" htmlFor="weightKg">
              <input
                id="weightKg"
                type="number"
                min={1}
                max={499}
                step="0.1"
                value={form.weightKg}
                onChange={(e) => update('weightKg', e.target.value)}
                className={inputClass}
                placeholder="e.g. 72.5"
              />
            </Field>
            <Field label="Height (cm)" htmlFor="heightCm">
              <input
                id="heightCm"
                type="number"
                min={51}
                max={249}
                value={form.heightCm}
                onChange={(e) => update('heightCm', e.target.value)}
                className={inputClass}
                placeholder="e.g. 178"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Sport & performance"
          subtitle="Used to estimate effort and energy expenditure on your routes."
        >
          <Field label="Disciplines">
            <div className="flex flex-wrap gap-2">
              {(['cycling'] as Discipline[]).map((d) => (
                <ChipButton
                  key={d}
                  active={form.disciplines.has(d)}
                  onClick={() => update('disciplines', toggle(form.disciplines, d))}
                >
                  {d === 'cycling' ? 'Cycling' : ''}
                </ChipButton>
              ))}
            </div>
          </Field>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {showCycling && (
              <Field
                label="Cycling FTP (watts)"
                hint="Your 60-minute threshold power."
                htmlFor="ftpWatts"
              >
                <input
                  id="ftpWatts"
                  type="number"
                  min={1}
                  max={699}
                  value={form.ftpWatts}
                  onChange={(e) => update('ftpWatts', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 250"
                />
              </Field>
            )}
            {/* {showRunning && (
              <Field
                label="Running threshold pace"
                hint="Sustainable threshold pace, mm:ss per km."
                htmlFor="runningThreshold"
              >
                <input
                  id="runningThreshold"
                  type="text"
                  inputMode="numeric"
                  pattern="\d+:\d{2}"
                  value={form.runningThresholdText}
                  onChange={(e) => update('runningThresholdText', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 4:30"
                />
              </Field>
            )} */}
            <Field label="Max heart rate (bpm)" htmlFor="maxHr">
              <input
                id="maxHr"
                type="number"
                min={81}
                max={229}
                value={form.maxHr}
                onChange={(e) => update('maxHr', e.target.value)}
                className={inputClass}
                placeholder="e.g. 188"
              />
            </Field>
            <Field label="Weekly training hours" htmlFor="weeklyTrainingHours">
              <input
                id="weeklyTrainingHours"
                type="number"
                min={0}
                max={50}
                step="0.5"
                value={form.weeklyTrainingHours}
                onChange={(e) => update('weeklyTrainingHours', e.target.value)}
                className={inputClass}
                placeholder="e.g. 8"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Fuelling & gut tolerance"
          subtitle="How much you can absorb, and what works for your stomach."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Sweat rate" htmlFor="sweatRate">
              <select
                id="sweatRate"
                value={form.sweatRate}
                onChange={(e) => update('sweatRate', e.target.value as FormState['sweatRate'])}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field
              label="Max carbs per hour (g)"
              hint="Carbs you can tolerate mid-race."
              htmlFor="maxCarbsGHr"
            >
              <input
                id="maxCarbsGHr"
                type="number"
                min={0}
                max={199}
                value={form.maxCarbsGHr}
                onChange={(e) => update('maxCarbsGHr', e.target.value)}
                className={inputClass}
                placeholder="e.g. 90"
              />
            </Field>
            <Field label="Caffeine tolerance" htmlFor="caffeineTolerance">
              <select
                id="caffeineTolerance"
                value={form.caffeineTolerance}
                onChange={(e) =>
                  update('caffeineTolerance', e.target.value as FormState['caffeineTolerance'])
                }
                className={inputClass}
              >
                <option value="">—</option>
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>

          <Field label="Preferred fuel forms" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(FUEL_FORM_LABELS) as [FuelForm, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.fuelForms.has(key)}
                  onClick={() => update('fuelForms', toggle(form.fuelForms, key))}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>
        </Section>

        <Section
          title="Diet & restrictions"
          subtitle="So Claude never suggests something you can't or won't eat."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Diet" htmlFor="diet">
              <select
                id="diet"
                value={form.diet}
                onChange={(e) => update('diet', e.target.value as FormState['diet'])}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
              </select>
            </Field>
          </div>

          <Field label="Allergies / avoid" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RESTRICTION_LABELS) as [Restriction, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  active={form.restrictions.has(key)}
                  onClick={() => update('restrictions', toggle(form.restrictions, key))}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </Field>

          <Field label="Other restrictions" htmlFor="restrictionsOther" className="mt-5">
            <input
              id="restrictionsOther"
              type="text"
              value={form.restrictionsOther}
              onChange={(e) => update('restrictionsOther', e.target.value)}
              className={inputClass}
              placeholder="e.g. low-FODMAP, no specific brand"
            />
          </Field>

          <Field
            label="Foods you can't stomach mid-race"
            htmlFor="avoidNotes"
            hint="Free text. Quick notes only."
            className="mt-5"
          >
            <textarea
              id="avoidNotes"
              rows={3}
              value={form.avoidNotes}
              onChange={(e) => update('avoidNotes', e.target.value)}
              className={inputClass}
              placeholder="e.g. no gels, hate bananas, gummies upset my stomach"
            />
          </Field>
        </Section>

        <Section title="Supplements" subtitle="What you typically take. Comma-separated.">
          <Field label="Supplements" htmlFor="supplements">
            <input
              id="supplements"
              type="text"
              value={form.supplements}
              onChange={(e) => update('supplements', e.target.value)}
              className={inputClass}
              placeholder="e.g. electrolytes, sodium tabs, magnesium"
            />
          </Field>
        </Section>

        <StravaSection />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/app/profile"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StravaSection() {
  const { data: status, isLoading } = useStravaStatus();
  const invalidate = useInvalidateStravaStatus();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { authUrl } = await api.get<{ authUrl: string }>('/api/integrations/strava/connect');
      window.location.href = authUrl;
    } catch {
      toast.error('Could not start Strava connection. Please try again.');
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.delete('/api/integrations/strava');
      invalidate();
      toast.success('Strava disconnected.');
    } catch (err) {
      toast.error(errorStatus(err) === 401 ? 'Session expired.' : 'Could not disconnect Strava.');
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = status?.connected === true;

  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">Connected apps</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Connect Strava to pull your last 3 days of activities into every plan you generate.
        </p>
      </header>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Strava wordmark colour */}
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none">
            <path d="M10.5 17.5 6 9l-4.5 8.5h3L6 13l1.5 4.5Z" fill="#FC4C02" />
            <path d="M15 9l-3 8.5h2.25L15 13.5l.75 4h2.25L15 9Z" fill="#FC4C02" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Strava</p>
            {isLoading ? (
              <p className="text-xs text-zinc-400">Checking…</p>
            ) : connected ? (
              <p className="text-xs text-emerald-600">
                Connected{status.athleteName ? ` as ${status.athleteName}` : ''}
              </p>
            ) : (
              <p className="text-xs text-zinc-400">Not connected</p>
            )}
          </div>
        </div>

        {!isLoading && (
          connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-full bg-[#FC4C02] px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {connecting ? 'Redirecting…' : 'Connect Strava'}
            </button>
          )
        )}
      </div>
    </section>
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
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
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
