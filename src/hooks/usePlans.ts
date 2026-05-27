import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
