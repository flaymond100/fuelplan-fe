import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useStravaRecentLoad,
  type StravaTrainingSnapshot,
  type SnapshotActivity,
} from '../hooks/useStravaRecentLoad';

/**
 * WHOOP-style training dashboard for the plan page.
 *
 * Dark, self-contained island on the otherwise-light page (a full-page dark
 * theme was tried and reverted earlier — this keeps the dark scoped here).
 * Fetched live on open relative to *today* via our authenticated backend; the
 * Strava OAuth token never reaches the browser. Metrics are mapped honestly to
 * the WHOOP visual vocabulary — no invented recovery/HRV scores we don't have.
 */

// Accent palette (WHOOP-ish)
const BLUE = { from: '#1d6ff2', to: '#7cc6ff', glow: 'rgba(75,170,255,0.40)' };
const GREEN = { from: '#0bbf6a', to: '#16ec5e', glow: 'rgba(22,236,94,0.40)' };

const LOAD_FULL_TSS = 1000; // 14-day TSS that visually fills the ring
const LOAD_FULL_HOURS = 20; // …or hours, when there's no power data

export default function TrainingLoadPanel() {
  const [open, setOpen] = useState(false);
  // Collapsed by default — only fetch from Strava once the panel is expanded.
  const { data, isLoading, isError, refetch, isFetching } = useStravaRecentLoad(open);

  const s = data?.snapshot ?? null;
  const range = s ? `${fmtShort(s.rangeStart)} – ${fmtShort(s.rangeEnd)}` : undefined;

  return (
    <Shell>
      <Header
        open={open}
        onToggle={() => setOpen((v) => !v)}
        range={range}
        onRefresh={open && data?.connected ? () => void refetch() : undefined}
        refreshing={isFetching}
      />
      {open && (
        <div className="mt-4">
          {isLoading || (!data && !isError) ? (
            <SkeletonBody />
          ) : isError || !data ? (
            <Unavailable onRetry={() => void refetch()} />
          ) : !data.connected ? (
            <ConnectInline />
          ) : !data.snapshot ? (
            <Unavailable onRetry={() => void refetch()} />
          ) : data.snapshot.totals.sessions === 0 ? (
            <Rested />
          ) : (
            <Body s={data.snapshot} />
          )}
        </div>
      )}
    </Shell>
  );
}

// ── Shell + header ────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-[#09090b] p-4 ring-1 ring-white/10 sm:p-5">
      {children}
    </section>
  );
}

function Header({
  open,
  onToggle,
  range,
  onRefresh,
  refreshing,
}: {
  open: boolean;
  onToggle: () => void;
  range?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex items-center gap-2.5 text-left"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-zinc-500 transition-transform group-hover:text-zinc-300 ${open ? 'rotate-90' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="block">
          <span className="block text-sm font-bold uppercase tracking-[0.18em] text-white">Training</span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            Last 14 days{range ? ` · ${range}` : ''}
          </span>
        </span>
      </button>
      <div className="flex items-center gap-3">
        <StravaBadge />
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh training data"
            className="text-zinc-500 transition hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────

function Body({ s }: { s: StravaTrainingSnapshot }) {
  const useTss = s.totals.tss != null && s.totals.tss > 0;

  const loadVal = useTss ? (s.totals.tss ?? 0) : s.totals.hours;
  const loadPct = loadVal / (useTss ? LOAD_FULL_TSS : LOAD_FULL_HOURS);
  const consPct = s.totals.activeDays / 14;

  return (
    <div className="space-y-3">
      {/* Hero: two rings + a gauge */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card caption="Training load">
          <Ring pct={loadPct} {...BLUE}>
            <span className="text-3xl font-bold tabular-nums text-white">
              {Math.round(loadVal).toLocaleString()}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {useTss ? '14-day TSS' : '14-day hrs'}
            </span>
          </Ring>
        </Card>

        <Card caption="Consistency">
          <Ring pct={consPct} {...GREEN}>
            <span className="text-3xl font-bold tabular-nums text-white">
              {s.totals.activeDays}
              <span className="text-lg text-zinc-500">/14</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              active days
            </span>
          </Ring>
        </Card>

        <Card caption="Build rate">
          <BuildGauge rampPct={s.rampPct} />
        </Card>
      </div>

      {/* Daily load bars */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            {useTss ? 'Daily load' : 'Daily hours'}
          </p>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-500">
            <Legend dot="bg-sky-400" label="this week" />
            <Legend dot="bg-zinc-600" label="last week" />
          </div>
        </div>
        <DayBars s={s} useTss={useTss} />
      </Card>

      {/* Sport split + recent activities */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            By sport
          </p>
          <SportBars s={s} />
        </Card>
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Recent activities
          </p>
          <div className="space-y-1.5">
            {s.activities.slice(0, 5).map((a, i) => (
              <ActivityRow key={i} a={a} />
            ))}
          </div>
        </Card>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Sessions" value={s.totals.sessions} />
        <Stat label="Hours" value={s.totals.hours} unit="h" />
        {s.totals.distanceKm > 0 && <Stat label="Distance" value={Math.round(s.totals.distanceKm)} unit="km" />}
        {s.totals.elevationM > 0 && <Stat label="Climbed" value={s.totals.elevationM.toLocaleString()} unit="m" />}
        {s.totals.kj != null && <Stat label="Energy" value={s.totals.kj.toLocaleString()} unit="kJ" />}
        <Stat
          label="Last session"
          value={
            s.daysSinceLastWorkout == null
              ? '—'
              : s.daysSinceLastWorkout === 0
                ? 'Today'
                : `${s.daysSinceLastWorkout}d`
          }
        />
      </div>

      {!useTss && (
        <p className="px-1 text-[11px] leading-relaxed text-zinc-500">
          Load shown as volume — set your FTP in your profile (and ride with power) to unlock TSS-based load.
        </p>
      )}
    </div>
  );
}

// ── WHOOP-style primitives ─────────────────────────────────────────────────

function Card({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl bg-[#161618] p-4 ring-1 ring-white/5">
      {caption && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{caption}</p>
      )}
      {caption ? <div className="flex justify-center py-1">{children}</div> : children}
    </div>
  );
}

/** Full-circle progress ring with a gradient stroke, starting at 12 o'clock. */
function Ring({
  pct,
  from,
  to,
  glow,
  size = 156,
  thickness = 13,
  children,
}: {
  pct: number;
  from: string;
  to: string;
  glow?: string;
  size?: number;
  thickness?: number;
  children: React.ReactNode;
}) {
  const id = useId().replace(/:/g, ''); // colon-free → safe in SVG url(#…)
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const arc = clamped * c;
  const cx = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#ffffff14" strokeWidth={thickness} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c - arc}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={glow ? { filter: `drop-shadow(0 0 5px ${glow})` } : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/** Semicircle gauge for week-over-week ramp. Green = sustainable, red = spike. */
function BuildGauge({ rampPct }: { rampPct: number | null }) {
  const id = useId().replace(/:/g, '');
  const size = 200;
  const thickness = 15;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = r + thickness / 2;
  const h = cy + 6;

  const MIN = -20;
  const MAX = 40;
  const frac = rampPct == null ? null : Math.max(0, Math.min(1, (rampPct - MIN) / (MAX - MIN)));

  // Needle position
  let needle: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (frac != null) {
    const a = Math.PI - frac * Math.PI;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const inner = r - thickness / 2 - 3;
    const outer = r + thickness / 2 + 3;
    needle = {
      x1: cx + inner * cosA,
      y1: cy - inner * sinA,
      x2: cx + outer * cosA,
      y2: cy - outer * sinA,
    };
  }

  const tone = rampTone(rampPct);

  return (
    <div className="relative" style={{ width: size, height: h + 30 }}>
      <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d6ff2" />
            <stop offset="42%" stopColor="#16ec5e" />
            <stop offset="68%" stopColor="#ffd400" />
            <stop offset="86%" stopColor="#ff8a00" />
            <stop offset="100%" stopColor="#ff4d4f" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        {needle && (
          <line
            x1={needle.x1}
            y1={needle.y1}
            x2={needle.x2}
            y2={needle.y2}
            stroke="#fff"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        )}
      </svg>
      {/* Center readout */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: cy - 42 }}>
        <span className={`text-3xl font-bold tabular-nums ${tone.color}`}>
          {rampPct == null ? '—' : `${rampPct > 0 ? '+' : ''}${rampPct}%`}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          vs last week
        </span>
      </div>
      {/* End labels */}
      <div className="absolute left-1 text-[9px] font-medium uppercase tracking-wider text-zinc-600" style={{ top: cy - 4 }}>
        Taper
      </div>
      <div className="absolute right-1 text-[9px] font-medium uppercase tracking-wider text-zinc-600" style={{ top: cy - 4 }}>
        Spike
      </div>
    </div>
  );
}

function DayBars({ s, useTss }: { s: StravaTrainingSnapshot; useTss: boolean }) {
  const value = (d: StravaTrainingSnapshot['daily'][number]) => (useTss ? d.tss : d.hours);
  const max = Math.max(...s.daily.map(value), useTss ? 1 : 0.1);

  return (
    <div>
      <div className="flex h-28 items-end gap-1">
        {s.daily.map((d, i) => {
          const v = value(d);
          const pct = Math.round((v / max) * 100);
          const isThisWeek = s.daily.length - i <= 7;
          const title = `${d.label} ${fmtShort(d.date)} · ${useTss ? `${d.tss} TSS` : `${d.hours}h`}${
            d.sessions > 1 ? ` · ${d.sessions} sessions` : ''
          }`;
          return (
            <div key={d.date} className="flex h-full flex-1 items-end" title={title}>
              {v > 0 ? (
                <div
                  className={`w-full rounded-t-sm bg-linear-to-t ${
                    isThisWeek ? 'from-[#1d6ff2] to-[#7cc6ff]' : 'from-zinc-700 to-zinc-500'
                  }`}
                  style={{ height: `${Math.max(pct, 6)}%` }}
                />
              ) : (
                <div className="h-0.75 w-full rounded-full bg-white/10" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {s.daily.map((d, i) => (
          <div
            key={d.date}
            className={`flex-1 text-center text-[9px] ${
              i === s.daily.length - 1 ? 'font-bold text-white' : 'text-zinc-600'
            }`}
          >
            {d.label.charAt(0)}
          </div>
        ))}
      </div>
    </div>
  );
}

function SportBars({ s }: { s: StravaTrainingSnapshot }) {
  const max = Math.max(...s.sports.map((sp) => sp.hours), 0.1);
  if (s.sports.length === 0) return <p className="text-xs text-zinc-500">No sports recorded.</p>;
  return (
    <div className="space-y-2.5">
      {s.sports.map((sp) => (
        <div key={sp.type}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <span className={`h-2 w-2 rounded-full ${sportColor(sp.type)}`} />
              {prettySport(sp.type)}
            </span>
            <span className="tabular-nums text-zinc-500">
              {sp.hours}h · {sp.sessions}×
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${sportBar(sp.type)}`}
              style={{ width: `${Math.max((sp.hours / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ a }: { a: SnapshotActivity }) {
  const when = a.daysAgo === 0 ? 'Today' : a.daysAgo === 1 ? 'Yesterday' : `${a.daysAgo}d ago`;
  const meta = [when, fmtDur(a.durationMin), a.distanceKm > 0 ? `${a.distanceKm} km` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/3 px-2.5 py-2">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sportSoft(a.type)}`}>
        <SportIcon type={a.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-200">{a.name || prettySport(a.type)}</p>
        <p className="truncate text-[11px] text-zinc-500">{meta}</p>
      </div>
      {a.tss != null ? (
        <span className="shrink-0 rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-sky-300">
          {a.tss} TSS
        </span>
      ) : a.avgHr != null ? (
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">{a.avgHr} bpm</span>
      ) : null}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="rounded-2xl bg-[#161618] px-3.5 py-3 ring-1 ring-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-zinc-500">{unit}</span>}
      </p>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function StravaBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: '#FC4C02' }}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M13.02 2 7.2 13.3h3.5L13.02 8.6l2.32 4.7h3.46L13.02 2Zm2.32 11.3-1.74 3.4-1.74-3.4H9.36L13.6 22l4.24-8.7h-2.5Z" />
      </svg>
      Strava
    </span>
  );
}

function SportIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4';
  const color = sportText(type);
  if (/Ride|MountainBike|Gravel|EBike/i.test(type)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18.5" cy="17.5" r="3.5" />
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="15" cy="5" r="1" />
        <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
      </svg>
    );
  }
  if (/Swim/i.test(type)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
        <path d="M2 20c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
        <circle cx="16" cy="6" r="1.5" />
        <path d="m6 13 5-3 3 2" />
      </svg>
    );
  }
  if (/Weight|Strength|Workout|Yoga/i.test(type)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 5l1-1 1 1 1 1-1 1M6 19l-1 1-1-1-1-1 1-1M5 8l3 3M16 13l3 3" />
      </svg>
    );
  }
  if (/Run/i.test(type)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="5" r="1.6" />
        <path d="m6 20 2.5-4.5L6 12l1-4 4 1.5 1.5 2.5L16 14M11 9l-3 1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// ── Empty / fallback states (dark) ───────────────────────────────────────────

function ConnectInline() {
  return (
    <Link
      to="/app/profile/edit"
      className="group flex items-center gap-4 rounded-2xl bg-[#161618] px-4 py-4 ring-1 ring-white/5 transition hover:ring-orange-500/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#FC4C02' }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
          <path d="M13.02 2 7.2 13.3h3.5L13.02 8.6l2.32 4.7h3.46L13.02 2Zm2.32 11.3-1.74 3.4-1.74-3.4H9.36L13.6 22l4.24-8.7h-2.5Z" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">Connect Strava</p>
        <p className="text-xs text-zinc-400">See your last 2 weeks of load, consistency & build rate.</p>
      </div>
      <span className="ml-auto shrink-0 text-xs font-medium text-zinc-500 transition group-hover:text-white">
        Connect →
      </span>
    </Link>
  );
}

function Unavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-[#161618] px-5 py-10 text-center text-sm text-zinc-400 ring-1 ring-white/5">
      Couldn't reach Strava just now.{' '}
      <button type="button" onClick={onRetry} className="font-medium text-white underline">
        Try again
      </button>
    </div>
  );
}

function Rested() {
  return (
    <div className="rounded-2xl bg-[#161618] px-5 py-10 text-center ring-1 ring-white/5">
      <p className="text-sm font-medium text-white">No sessions in the last 2 weeks</p>
      <p className="mt-1 text-xs text-zinc-500">Fully rested — or your Strava activities are private.</p>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#161618]" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-[#161618]" />
    </div>
  );
}

// ── Formatting + tone helpers ────────────────────────────────────────────────

function fmtShort(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

function rampTone(pct: number | null): { color: string } {
  if (pct == null) return { color: 'text-zinc-400' };
  if (pct > 25) return { color: 'text-rose-400' };
  if (pct > 12) return { color: 'text-amber-400' };
  if (pct < -5) return { color: 'text-sky-400' };
  return { color: 'text-emerald-400' };
}

function prettySport(t: string): string {
  const named: Record<string, string> = {
    Ride: 'Ride',
    VirtualRide: 'Virtual ride',
    MountainBikeRide: 'MTB',
    GravelRide: 'Gravel',
    EBikeRide: 'E-bike',
    Run: 'Run',
    TrailRun: 'Trail run',
    VirtualRun: 'Treadmill',
    Swim: 'Swim',
    WeightTraining: 'Strength',
    Workout: 'Workout',
    Walk: 'Walk',
    Hike: 'Hike',
    Yoga: 'Yoga',
  };
  return named[t] ?? t.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function sportColor(t: string): string {
  if (/Ride|MountainBike|Gravel|EBike/i.test(t)) return 'bg-amber-400';
  if (/Run/i.test(t)) return 'bg-emerald-400';
  if (/Swim/i.test(t)) return 'bg-sky-400';
  if (/Weight|Workout|Strength|Yoga/i.test(t)) return 'bg-violet-400';
  return 'bg-zinc-400';
}

function sportBar(t: string): string {
  if (/Ride|MountainBike|Gravel|EBike/i.test(t)) return 'bg-amber-400';
  if (/Run/i.test(t)) return 'bg-emerald-400';
  if (/Swim/i.test(t)) return 'bg-sky-400';
  if (/Weight|Workout|Strength|Yoga/i.test(t)) return 'bg-violet-400';
  return 'bg-zinc-400';
}

function sportText(t: string): string {
  if (/Ride|MountainBike|Gravel|EBike/i.test(t)) return 'text-amber-400';
  if (/Run/i.test(t)) return 'text-emerald-400';
  if (/Swim/i.test(t)) return 'text-sky-400';
  if (/Weight|Workout|Strength|Yoga/i.test(t)) return 'text-violet-400';
  return 'text-zinc-300';
}

// Literal class strings (incl. opacity) so Tailwind's scanner can see them —
// a dynamically-built `${...}/15` would never be generated.
function sportSoft(t: string): string {
  if (/Ride|MountainBike|Gravel|EBike/i.test(t)) return 'bg-amber-400/15';
  if (/Run/i.test(t)) return 'bg-emerald-400/15';
  if (/Swim/i.test(t)) return 'bg-sky-400/15';
  if (/Weight|Workout|Strength|Yoga/i.test(t)) return 'bg-violet-400/15';
  return 'bg-zinc-400/15';
}
