export type TempCategory = 'cool' | 'mild' | 'warm' | 'hot';

export type WeatherForecast = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbabilityPct: number;
  windSpeedMaxKmh: number;
  weatherCode: number;
};

export type WeatherResult =
  | { kind: 'forecast'; data: WeatherForecast }
  | { kind: 'out_of_range'; daysAway: number; reason: 'past' | 'too_far' };

const MAX_FORECAST_DAYS = 16;

export async function fetchWeather(
  lat: number,
  lng: number,
  date: string,
): Promise<WeatherResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(date);
  raceDate.setHours(0, 0, 0, 0);
  const daysAway = Math.round((raceDate.getTime() - today.getTime()) / 86400000);

  if (daysAway < 0) {
    return { kind: 'out_of_range', daysAway, reason: 'past' };
  }
  if (daysAway > MAX_FORECAST_DAYS) {
    return { kind: 'out_of_range', daysAway, reason: 'too_far' };
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'daily',
    [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'weather_code',
    ].join(','),
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const json = (await res.json()) as {
    daily?: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
      wind_speed_10m_max: number[];
      weather_code: number[];
    };
  };

  const daily = json.daily;
  if (!daily || !daily.time || daily.time.length === 0) {
    return { kind: 'out_of_range', daysAway, reason: 'too_far' };
  }

  return {
    kind: 'forecast',
    data: {
      date: daily.time[0],
      tempMaxC: daily.temperature_2m_max[0],
      tempMinC: daily.temperature_2m_min[0],
      precipitationProbabilityPct: daily.precipitation_probability_max[0] ?? 0,
      windSpeedMaxKmh: daily.wind_speed_10m_max[0],
      weatherCode: daily.weather_code[0],
    },
  };
}

export function tempToCategory(tempMaxC: number): TempCategory {
  if (tempMaxC < 15) return 'cool';
  if (tempMaxC < 22) return 'mild';
  if (tempMaxC < 28) return 'warm';
  return 'hot';
}
