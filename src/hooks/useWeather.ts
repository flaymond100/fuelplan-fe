import { useQuery } from '@tanstack/react-query';
import { fetchWeather, type WeatherResult } from '../lib/weather';

export function useWeather(lat: number | null, lng: number | null, date: string) {
  return useQuery<WeatherResult>({
    queryKey: ['weather', lat, lng, date],
    enabled: lat !== null && lng !== null && !!date,
    queryFn: () => fetchWeather(lat as number, lng as number, date),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
