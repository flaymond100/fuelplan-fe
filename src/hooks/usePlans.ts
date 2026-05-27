import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { extractGpxTrack } from '../lib/gpx';
import { useSession } from './useSession';
import type { PlanRow } from '../types';

export const plansQueryKey = (userId: string | undefined) => ['plans', userId] as const;
export const planQueryKey = (id: string | undefined) => ['plan', id] as const;

export function usePlans() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: plansQueryKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('race_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PlanRow[];
    },
  });
}

export function useLatestPlan() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['plan', 'latest', userId] as const,
    enabled: !!userId,
    queryFn: async (): Promise<PlanRow | null> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as PlanRow | null;
    },
  });
}

/**
 * Fetches the plan's route track for map rendering. Two hops:
 * 1. GET /api/plans/:id/gpx → { url } (short-lived signed URL; bucket is service-role-only)
 * 2. fetch(url) → GPX text → decimated [lat, lng][]
 */
export function useRouteTrack(id: string | undefined) {
  return useQuery({
    queryKey: ['route', id] as const,
    enabled: !!id,
    staleTime: Infinity, // a plan's GPX never changes
    retry: 1,
    queryFn: async (): Promise<[number, number][]> => {
      const { url } = await api.get<{ url: string }>(`/api/plans/${id}/gpx`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch GPX (${res.status})`);
      return extractGpxTrack(await res.text());
    },
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: planQueryKey(id),
    enabled: !!id,
    queryFn: async (): Promise<PlanRow | null> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as PlanRow | null;
    },
  });
}
