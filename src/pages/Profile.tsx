import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import {
  FUEL_FORM_LABELS,
  RESTRICTION_LABELS,
  formatDate,
  formatPace,
  humanize,
} from '../lib/profileFormat';
import type { ProfileRow } from '../types';

export default function Profile() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadState('error');
          return;
        }
        if (data) setProfile(data as unknown as ProfileRow);
        setLoadState('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loadState === 'loading') {
    return (
      <div>
        <Header />
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          Loading…
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div>
        <Header />
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Could not load your profile. Refresh to try again.
        </div>
      </div>
    );
  }

  const p = profile;
  const disciplines = p?.disciplines ?? [];
  const showCycling = disciplines.includes('cycling');
  const showRunning = disciplines.includes('running');
  const fuelForms = p?.fuel_forms ?? [];
  const restrictions = p?.restrictions ?? [];
  const supplements = p?.supplements ?? [];

  return (
    <div>
      <Header />

      <div className="mt-8 space-y-6">
        <Section title="About you">
          <Detail label="Full name" value={p?.full_name} />
          <Detail label="Date of birth" value={formatDate(p?.birth_date)} muted={!p?.birth_date} />
          <Detail label="Sex" value={humanize(p?.sex)} muted={!p?.sex} />
          <Detail
            label="Weight"
            value={p?.weight_kg != null ? `${p.weight_kg} kg` : null}
          />
          <Detail
            label="Height"
            value={p?.height_cm != null ? `${p.height_cm} cm` : null}
          />
        </Section>

        <Section title="Sport & performance">
          <Detail label="Disciplines">
            {disciplines.length ? <Chips items={disciplines.map(humanize)} /> : <Dash />}
          </Detail>
          {showCycling && (
            <Detail
              label="Cycling FTP"
              value={p?.ftp_watts != null ? `${p.ftp_watts} W` : null}
            />
          )}
          {showRunning && (
            <Detail
              label="Running threshold"
              value={
                p?.running_threshold_sec_per_km != null
                  ? `${formatPace(p.running_threshold_sec_per_km)} /km`
                  : null
              }
            />
          )}
          <Detail
            label="Max heart rate"
            value={p?.max_hr != null ? `${p.max_hr} bpm` : null}
          />
          <Detail
            label="Weekly training hours"
            value={p?.weekly_training_hours != null ? `${p.weekly_training_hours} hr/week` : null}
          />
        </Section>

        <Section title="Fuelling & gut tolerance">
          <Detail label="Sweat rate" value={humanize(p?.sweat_rate)} muted={!p?.sweat_rate} />
          <Detail
            label="Max carbs per hour"
            value={p?.max_carbs_g_hr != null ? `${p.max_carbs_g_hr} g/hr` : null}
          />
          <Detail
            label="Caffeine tolerance"
            value={humanize(p?.caffeine_tolerance)}
            muted={!p?.caffeine_tolerance}
          />
          <Detail label="Preferred fuel forms">
            {fuelForms.length ? (
              <Chips items={fuelForms.map((f) => FUEL_FORM_LABELS[f])} />
            ) : (
              <Dash />
            )}
          </Detail>
        </Section>

        <Section title="Diet & restrictions">
          <Detail label="Diet" value={humanize(p?.diet)} muted={!p?.diet} />
          <Detail label="Allergies / avoid">
            {restrictions.length ? (
              <Chips items={restrictions.map((r) => RESTRICTION_LABELS[r])} />
            ) : (
              <Dash />
            )}
          </Detail>
          <Detail label="Other restrictions" value={p?.restrictions_other} />
          <Detail label="Foods to avoid mid-race" value={p?.avoid_notes} multiline />
        </Section>

        <Section title="Supplements">
          <Detail label="Supplements">
            {supplements.length ? <Chips items={supplements} /> : <Dash />}
          </Detail>
        </Section>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader
        title="Profile"
        subtitle="Body, training, fuelling, and dietary preferences."
      />
      <Link
        to="/app/profile/edit"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-600/20 transition hover:shadow-orange-500/40 hover:brightness-110"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M14.69 2.66a2.25 2.25 0 0 1 3.18 3.18l-9.6 9.6a2 2 0 0 1-.86.51l-3.21.92a.75.75 0 0 1-.93-.93l.92-3.21a2 2 0 0 1 .51-.86l9.99-9.21Z" />
        </svg>
        Edit profile
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <dl className="mt-4 divide-y divide-zinc-100">{children}</dl>
    </section>
  );
}

function Detail({
  label,
  value,
  children,
  muted,
  multiline,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
  muted?: boolean;
  multiline?: boolean;
}) {
  const hasValue = children !== undefined || (value != null && value !== '');
  const display = children !== undefined
    ? children
    : hasValue
      ? <span className={muted ? 'text-zinc-400' : ''}>{value}</span>
      : <Dash />;

  return (
    <div className={`grid gap-1 py-3 sm:gap-3 ${multiline ? 'sm:grid-cols-1' : 'sm:grid-cols-3'}`}>
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className={`text-sm text-zinc-900 ${multiline ? 'whitespace-pre-line' : 'sm:col-span-2'}`}>
        {display}
      </dd>
    </div>
  );
}

function Dash() {
  return <span className="text-zinc-400">—</span>;
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
