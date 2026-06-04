import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSession } from './useSession';

// Mirrors the backend `StravaTrainingSnapshot` shape returned by
// GET /api/integrations/strava/recent-load. Keyed to *now*, not the race date —
// the panel shows the athlete's last 2 weeks as of opening the plan.

export interface SnapshotActivity {
  type: string;
  name: string;
  date: string;
  daysAgo: number;
  durationMin: number;
  distanceKm: number;
  elevationM: number | null;
  avgWatts: number | null;
  normalizedWatts: number | null;
  avgHr: number | null;
  avgSpeedKmh: number | null;
  tss: number | null;
  intensityFactor: number | null;
  kilojoules: number | null;
}

export interface DailyLoad {
  date: string;
  label: string;
  tss: number;
  hours: number;
  sessions: number;
}

export interface SportBreakdown {
  type: string;
  sessions: number;
  hours: number;
  tss: number | null;
}

export interface StravaTrainingSnapshot {
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  ftpUsed: number | null;
  hasPower: boolean;
  totals: {
    sessions: number;
    hours: number;
    tss: number | null;
    kj: number | null;
    distanceKm: number;
    elevationM: number;
    activeDays: number;
  };
  thisWeek: { tss: number | null; hours: number; sessions: number };
  prevWeek: { tss: number | null; hours: number; sessions: number };
  rampPct: number | null;
  daysSinceLastWorkout: number | null;
  longestSession: { type: string; durationMin: number; distanceKm: number } | null;
  daily: DailyLoad[];
  sports: SportBreakdown[];
  activities: SnapshotActivity[];
}

export interface StravaRecentLoad {
  connected: boolean;
  snapshot: StravaTrainingSnapshot | null;
}

export const stravaRecentLoadKey = () => ['strava-recent-load'] as const;

/**
 * @param enabled gate the (heavy) Strava fetch — pass the panel's expanded
 *   state so we don't hit Strava on every plan load for a collapsed panel.
 */
export function useStravaRecentLoad(enabled = true) {
  const { session } = useSession();
  return useQuery<StravaRecentLoad>({
    queryKey: stravaRecentLoadKey(),
    enabled: enabled && !!session,
    staleTime: 5 * 60 * 1000, // live-ish: refetch at most every 5 minutes
    retry: 1,
    queryFn: () => api.get<StravaRecentLoad>('/api/integrations/strava/recent-load'),
  });
}
