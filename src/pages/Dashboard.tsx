import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, Ring, StatusPill, buttonClass } from '../components/ui';
import { useSession } from '../hooks/useSession';
import { useProfile } from '../hooks/useProfile';
import { usePlans } from '../hooks/usePlans';
import { useStravaStatus } from '../hooks/useStravaStatus';
import { formatDate } from '../lib/profileFormat';
import type { PlanRow, ProfileRow } from '../types';

export default function Dashboard() {
  const { session } = useSession();
  const { data: profile } = useProfile();
  const { data: plans = [] } = usePlans();
  const { data: strava } = useStravaStatus();

  const email = session?.user.email ?? '';
  const firstName = profile?.full_name?.split(' ')[0] || email.split('@')[0];
  const connected = strava?.connected ?? false;

  const pct = profilePct(profile);
  const { next, days } = nextRace(plans);

  const steps = [
    { label: 'Complete your profile', done: pct >= 75, to: '/app/profile/edit' },
    { label: 'Connect Strava', done: connected, to: '/app/profile/edit' },
    { label: 'Create your first plan', done: plans.length > 0, to: '/app/plans/new' },
  ];
  const stepsDone = steps.filter((s) => s.done).length;
  const checklistPct = Math.round((stepsDone / steps.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            Welcome back{firstName ? `, ${firstName}` : ''} <span className="align-middle">👋</span>
          </>
        }
        subtitle="Your race nutrition, training load and profile — at a glance."
        action={
          <Link to="/app/plans/new" className={buttonClass('primary')}>
            <PlusIcon /> New plan
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Plans created"
          value={plans.length}
          icon={<ListIcon />}
          footer={
            plans.length > 0 && (
              <Link to="/app/plans" className="text-sm font-medium text-brand-700 hover:text-brand-600">
                View all →
              </Link>
            )
          }
        />
        <StatCard
          label="Next race"
          value={days != null ? days : '—'}
          unit={days != null ? (days === 1 ? 'day' : 'days') : undefined}
          icon={<FlagIcon />}
          footer={
            next?.race_name && (
              <span className="truncate text-sm text-zinc-500" title={next.race_name}>
                {next.race_name}
              </span>
            )
          }
        />
        <StatCard
          label="Profile complete"
          value={`${pct}%`}
          icon={<UserIcon />}
          footer={
            <Link to="/app/profile/edit" className="text-sm font-medium text-brand-700 hover:text-brand-600">
              {pct < 100 ? 'Finish →' : 'Edit →'}
            </Link>
          }
        />
        <StatCard
          label="Strava"
          value={connected ? 'Linked' : 'Off'}
          icon={<StravaIcon />}
          delta={
            connected ? (
              <StatusPill tone="brand">Connected</StatusPill>
            ) : (
              <StatusPill tone="zinc">Not linked</StatusPill>
            )
          }
          footer={
            !connected && (
              <Link to="/app/profile/edit" className="text-sm font-medium text-brand-700 hover:text-brand-600">
                Connect →
              </Link>
            )
          }
        />
      </div>

      {/* Recent plans + getting started */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Recent plans"
          subtitle="Your latest race-day nutrition plans."
          right={
            plans.length > 0 ? (
              <Link to="/app/plans" className="text-sm font-medium text-brand-700 hover:text-brand-600">
                All plans →
              </Link>
            ) : undefined
          }
        >
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300/70 bg-white/40 p-10 text-center">
              <p className="text-sm text-zinc-500">
                No plans yet.{' '}
                <Link to="/app/plans/new" className="font-medium text-brand-700 hover:text-brand-600">
                  Create your first one →
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.slice(0, 5).map((p) => (
                <RecentPlanRow key={p.id} plan={p} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Getting started" subtitle="A few steps to your best plan.">
          <div className="flex items-center gap-5">
            <Ring pct={checklistPct / 100} size={104} thickness={10} glow="rgba(132,204,22,0.35)">
              <span className="text-2xl font-bold tabular-nums text-zinc-900">{checklistPct}%</span>
            </Ring>
            <div className="flex-1 space-y-2.5">
              {steps.map((s) => (
                <Link key={s.label} to={s.to} className="group flex items-center gap-2.5">
                  <Check done={s.done} />
                  <span className={`text-sm ${s.done ? 'text-zinc-400 line-through' : 'text-zinc-700 group-hover:text-zinc-900'}`}>
                    {s.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function RecentPlanRow({ plan }: { plan: PlanRow }) {
  const totals = plan.plan_json?.totals;
  const discipline = plan.request_params?.discipline;
  return (
    <Link
      to={`/app/plans/${plan.id}`}
      className="group flex items-center gap-3 rounded-2xl bg-white/40 p-3 ring-1 ring-transparent transition hover:bg-white/70 hover:ring-white/70"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-400/15 text-brand-700">
        <DisciplineIcon discipline={discipline} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{plan.race_name ?? 'Untitled plan'}</p>
        <p className="truncate text-xs text-zinc-500">
          {[plan.race_date && formatDate(plan.race_date), plan.distance_km != null && `${plan.distance_km} km`, plan.elevation_m != null && `${plan.elevation_m} m`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {totals && (
        <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900">
          {totals.kcal.toLocaleString()}
          <span className="ml-0.5 text-xs font-medium text-zinc-400">kcal</span>
        </span>
      )}
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600">
        <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
      </svg>
    </Link>
  );
}

function Check({ done }: { done: boolean }) {
  return done ? (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-400 text-zinc-950">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-300" />
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function profilePct(p?: ProfileRow | null): number {
  if (!p) return 0;
  const checks = [
    p.full_name,
    p.weight_kg,
    p.sex,
    p.disciplines?.length,
    p.sweat_rate,
    p.max_carbs_g_hr,
    p.caffeine_tolerance,
    p.fuel_forms?.length,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function nextRace(plans: PlanRow[]): { next: PlanRow | null; days: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = plans
    .filter((p) => p.race_date && new Date(p.race_date).getTime() >= today.getTime())
    .sort((a, b) => (a.race_date! < b.race_date! ? -1 : 1));
  const next = upcoming[0] ?? null;
  const days = next?.race_date
    ? Math.ceil((new Date(next.race_date).getTime() - today.getTime()) / 86400000)
    : null;
  return { next, days };
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

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V4 M4 4h11l-1.5 3.5L15 11H4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function StravaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M13.02 2 7.2 13.3h3.5L13.02 8.6l2.32 4.7h3.46L13.02 2Zm2.32 11.3-1.74 3.4-1.74-3.4H9.36L13.6 22l4.24-8.7h-2.5Z" />
    </svg>
  );
}
