/* eslint-disable react-refresh/only-export-components --
   This is the shared UI kit: it intentionally exports helpers (glass,
   buttonClass, inputClass) next to components so call sites have one import.
   The only cost is coarser HMR for this file. */
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * Shared UI kit for the lime/glass dashboard look.
 * Frosted cards on a soft gradient backdrop, lime-green primary accent,
 * amber as the warm secondary. Built on Tailwind v4 tokens defined in
 * index.css (`brand-*` = lime, `fuel-*` = amber).
 *
 * NB: all class strings here are literals so Tailwind's scanner sees them —
 * never build accent classes by string concatenation at call sites.
 */

// ── Surfaces ─────────────────────────────────────────────────────────────────

/** Frosted-glass surface classes. Pass extra utilities (padding, etc.). */
export function glass(extra = ''): string {
  return `rounded-3xl bg-white/60 ring-1 ring-white/70 shadow-[0_18px_50px_-22px_rgba(15,23,42,0.35)] backdrop-blur-xl ${extra}`;
}

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={glass(className)}>{children}</div>;
}

export function SectionCard({
  title,
  subtitle,
  right,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`p-6 ${className}`}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </Card>
  );
}

export function IconBadge({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-zinc-500 ring-1 ring-white/80 ${className}`}>
      {children}
    </span>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost';

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
  const v =
    variant === 'primary'
      ? 'bg-brand-400 text-zinc-950 shadow-lg shadow-brand-500/30 hover:bg-brand-300'
      : variant === 'secondary'
        ? 'bg-white/70 text-zinc-800 ring-1 ring-white/80 backdrop-blur hover:bg-white'
        : 'text-zinc-600 hover:bg-white/60';
  return `${base} ${v} ${extra}`;
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

// ── Pills & badges ─────────────────────────────────────────────────────────

export function Pill({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-sm text-zinc-700 ring-1 ring-white/80 ${className}`}>
      {children}
    </span>
  );
}

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'zinc';

const TONE_PILL: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700 ring-brand-300/50',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-300/50',
  amber: 'bg-amber-100 text-amber-700 ring-amber-300/50',
  rose: 'bg-rose-100 text-rose-700 ring-rose-300/50',
  sky: 'bg-sky-100 text-sky-700 ring-sky-300/50',
  violet: 'bg-violet-100 text-violet-700 ring-violet-300/50',
  zinc: 'bg-zinc-100 text-zinc-600 ring-zinc-300/50',
};

export function StatusPill({
  tone = 'zinc',
  className = '',
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE_PILL[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Up/down delta. `goodWhenUp=false` flips the colour (e.g. refund requests). */
export function DeltaBadge({
  value,
  suffix = '%',
  goodWhenUp = true,
  className = '',
}: {
  value: number;
  suffix?: string;
  goodWhenUp?: boolean;
  className?: string;
}) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  const cls = good ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${cls} ${className}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}
      {suffix}
    </span>
  );
}

// ── Metric card ──────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  unit,
  icon,
  delta,
  footer,
  className = '',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  delta?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {icon && <IconBadge>{icon}</IconBadge>}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-zinc-900">
        {value}
        {unit && <span className="ml-1 text-lg font-semibold text-zinc-400">{unit}</span>}
      </p>
      {(delta || footer) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">{delta}</span>
          {footer}
        </div>
      )}
    </Card>
  );
}

// ── Data viz ─────────────────────────────────────────────────────────────────

/** Circular progress ring with a gradient stroke, starting at 12 o'clock. */
export function Ring({
  pct,
  size = 132,
  thickness = 11,
  from = '#a3e635',
  to = '#4d7c0f',
  track = 'rgba(15,23,42,0.08)',
  glow,
  children,
}: {
  pct: number;
  size?: number;
  thickness?: number;
  from?: string;
  to?: string;
  track?: string;
  glow?: string;
  children?: ReactNode;
}) {
  const id = useId().replace(/:/g, '');
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
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={track} strokeWidth={thickness} />
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
          style={glow ? { filter: `drop-shadow(0 0 6px ${glow})` } : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Tiny inline bar series. Give the container a height via className (e.g. h-10). */
export function MicroBars({
  values,
  className = '',
  barClass = 'bg-brand-400',
}: {
  values: number[];
  className?: string;
  barClass?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className={`flex items-end gap-0.5 ${className}`}>
      {values.map((v, i) => (
        <div
          key={i}
          className={`min-w-0 flex-1 rounded-sm ${barClass}`}
          style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
        />
      ))}
    </div>
  );
}

export function SegmentedBar({
  segments,
  className = '',
}: {
  segments: { value: number; className: string }[];
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className={`flex h-3 overflow-hidden rounded-full bg-zinc-200/70 ${className}`}>
      {segments.map((s, i) => (
        <div key={i} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />
      ))}
    </div>
  );
}

// ── Forms ──────────────────────────────────────────────────────────────────

export const inputClass =
  'block w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm backdrop-blur transition placeholder:text-zinc-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/30';

export function Field({
  label,
  hint,
  htmlFor,
  required,
  className = '',
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-brand-400 text-zinc-950 shadow-sm shadow-brand-500/30'
          : 'bg-white/60 text-zinc-700 ring-1 ring-white/70 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}
