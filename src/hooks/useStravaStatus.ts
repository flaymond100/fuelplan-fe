import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSession } from './useSession';

export type StravaStatus =
  | { connected: true; athleteName: string; profilePic: string | null }
  | { connected: false };

export const stravaStatusKey = () => ['strava-status'] as const;

export function useStravaStatus() {
  const { session } = useSession();
  return useQuery<StravaStatus>({
    queryKey: stravaStatusKey(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    queryFn: () => api.get<StravaStatus>('/api/integrations/strava/status'),
  });
}

export function useInvalidateStravaStatus() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: stravaStatusKey() });
}
