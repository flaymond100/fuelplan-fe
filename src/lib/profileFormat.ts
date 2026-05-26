import type { FuelForm, Restriction } from '../types';

export const FUEL_FORM_LABELS: Record<FuelForm, string> = {
  gels: 'Gels',
  chews: 'Chews',
  bars: 'Bars',
  drink_mix: 'Drink mix',
  real_food: 'Real food',
};

export const RESTRICTION_LABELS: Record<Restriction, string> = {
  gluten: 'Gluten',
  dairy: 'Dairy',
  nuts: 'Nuts',
  soy: 'Soy',
  eggs: 'Eggs',
  shellfish: 'Shellfish',
};

export function humanize(s: string | null | undefined): string {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function formatPace(sec: number | null | undefined): string {
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function parsePace(text: string): number | null {
  if (!text) return null;
  const match = text.match(/^(\d+):(\d{1,2})$/);
  if (!match) return null;
  const m = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  if (s >= 60) return null;
  return m * 60 + s;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
