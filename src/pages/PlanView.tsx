import { useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import RouteMap, { type RouteMapHandle } from '../components/RouteMap';
import ElevationProfile from '../components/ElevationProfile';
import ClimbCard from '../components/ClimbCard';
import { usePlan, useRouteTrack } from '../hooks/usePlans';
import { useWeather } from '../hooks/useWeather';
import { degToCompass } from '../lib/weather';
import { formatDate } from '../lib/profileFormat';
import type { PlanNutrientTotals, PlanPhase, PlanRow } from '../types';

export default function PlanView() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading, isError } = usePlan(id);

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-2xl bg-zinc-950 p-12 text-center text-sm text-zinc-500">
          Loading plan…
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Couldn't load this plan. It may not exist, or it isn't yours.
        </div>
      </div>
    );
  }

  const p = plan.plan_json;
  const rp = plan.request_params ?? {};
  const tagline = [rp.discipline, rp.planWindow && `${rp.planWindow} plan`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <BackLink />

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <div className="p-6 sm:p-8">
          {tagline && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              {tagline}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {plan.race_name ?? 'Your plan'}
          </h1>
          {p.summary && <p className="mt-3 max-w-2xl text-zinc-600">{p.summary}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {plan.race_date && <Pill>{formatDate(plan.race_date)}</Pill>}
            {plan.distance_km != null && <Pill>{plan.distance_km} km</Pill>}
            {plan.elevation_m != null && <Pill>{plan.elevation_m} m climb</Pill>}
            <Pill>Est. {formatDuration(p.estimatedDurationMin)}</Pill>
          </div>
        </div>

        <div className="px-6 sm:px-8">
          <RouteSection id={id} />
        </div>

        <div className="px-6 pt-6 sm:px-8">
          <WeatherSection
            lat={rp.gpxMeta?.startLat}
            lng={rp.gpxMeta?.startLng}
            date={plan.race_date}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px bg-zinc-200 sm:grid-cols-3 lg:grid-cols-5">
          <MetricTile label="Carbs" value={p.totals.carbsG} unit="g" />
          <MetricTile label="Fluids" value={p.totals.fluidsMl} unit="ml" />
          <MetricTile label="Sodium" value={p.totals.sodiumMg} unit="mg" />
          <MetricTile label="Caffeine" value={p.totals.caffeineMg} unit="mg" />
          <MetricTile label="Energy" value={p.totals.kcal} unit="kcal" />
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          {p.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ul className="space-y-1.5 text-sm text-amber-800">
                {p.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.phases.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteSection({ id }: { id: string | undefined }) {
  const { data, isLoading, isError } = useRouteTrack(id);
  const mapRef = useRef<RouteMapHandle>(null);
  const handleHover = useCallback((latlng: [number, number] | null) => {
    mapRef.current?.setCursor(latlng);
  }, []);

  if (isLoading) {
    return (
      <div className="grid h-72 w-full place-items-center rounded-xl bg-zinc-100 text-sm text-zinc-500">
        Loading route…
      </div>
    );
  }
  if (isError || !data || data.track.length === 0) {
    return (
      <div className="grid h-72 w-full place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        Route map unavailable.
      </div>
    );
  }
  return (
    <>
      <RouteMap ref={mapRef} track={data.track} profile={data.profile} />
      {data.profile && data.profile.length >= 2 && (
        <ElevationProfile points={data.profile} climbs={data.climbs} onHover={handleHover} />
      )}
      {data.climbs.length > 0 && data.profile && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Climb breakdown
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.climbs.map((climb, i) => (
              <ClimbCard key={i} climb={climb} index={i} points={data.profile!} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function WeatherSection({
  lat,
  lng,
  date,
}: {
  lat: number | undefined;
  lng: number | undefined;
  date: string | null;
}) {
  const hasCoords = lat != null && lng != null && (lat !== 0 || lng !== 0);
  const { data } = useWeather(hasCoords ? lat : null, hasCoords ? lng : null, date ?? '');

  if (!hasCoords || !data) return null;

  if (data.kind === 'out_of_range') {
    if (data.reason === 'past') return null;
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        Forecast available closer to race day — {data.daysAway} days out.
      </div>
    );
  }

  const f = data.data;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <WeatherTile label="Conditions" main={weatherLabel(f.weatherCode)} />
      <WeatherTile
        label="Temp"
        main={`${Math.round(f.tempMaxC)}° / ${Math.round(f.tempMinC)}°`}
        icon={
          <span className="flex items-center gap-0.5 text-xs">
            <Caret up className="text-rose-400" />
            <Caret className="text-sky-400" />
          </span>
        }
      />
      <WeatherTile
        label="Wind"
        main={`${Math.round(f.windSpeedMaxKmh)} km/h`}
        sub={`from ${degToCompass(f.windDirectionDeg)}`}
        icon={
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `rotate(${f.windDirectionDeg + 180}deg)` }}
          >
            <path d="M12 3v18 M6 9l6-6 6 6" />
          </svg>
        }
      />
      <WeatherTile label="Rain" main={`${f.precipitationProbabilityPct}%`} icon={<Droplet />} />
    </div>
  );
}

function PhaseCard({ phase, plan }: { phase: PlanPhase; plan: PlanRow }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 px-5 py-3.5">
        <h2 className="font-semibold text-zinc-900">{phase.label}</h2>
        <p className="text-xs text-zinc-500">{nutrientLine(phase.totals)}</p>
      </header>
      <ul className="divide-y divide-zinc-100">
        {phase.items.map((item, i) => (
          <li key={i} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-4">
            <div className="w-28 flex-shrink-0 text-sm font-semibold text-amber-400">
              {itemTime(plan.race_date, plan.start_time, item.offsetMin, item.label)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-900">{item.what}</p>
              {nutrientLine(item) && (
                <p className="mt-0.5 text-xs text-zinc-500">{nutrientLine(item)}</p>
              )}
              {item.notes && <p className="mt-1 text-xs italic text-zinc-500">{item.notes}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetricTile({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-white px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900">
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}

function WeatherTile({
  label,
  main,
  sub,
  icon,
}: {
  label: string;
  main: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {icon}
        <span className="text-lg font-semibold text-zinc-900">{main}</span>
      </div>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700">
      {children}
    </span>
  );
}

function Caret({ up, className }: { up?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 ${className ?? ''}`}>
      {up ? (
        <path fillRule="evenodd" d="M10 5a.75.75 0 0 1 .55.24l4 4.5a.75.75 0 1 1-1.1 1.02L10 6.94l-3.45 3.82a.75.75 0 0 1-1.1-1.02l4-4.5A.75.75 0 0 1 10 5Z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M10 15a.75.75 0 0 1-.55-.24l-4-4.5a.75.75 0 1 1 1.1-1.02L10 13.06l3.45-3.82a.75.75 0 0 1 1.1 1.02l-4 4.5A.75.75 0 0 1 10 15Z" clipRule="evenodd" />
      )}
    </svg>
  );
}

function Droplet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-sky-400">
      <path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5Z" />
    </svg>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/plans"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
      </svg>
      All plans
    </Link>
  );
}

function nutrientLine(n: PlanNutrientTotals & { fatG?: number; proteinG?: number }): string {
  const parts: string[] = [];
  if (n.carbsG) parts.push(`${n.carbsG} g carbs`);
  if (n.proteinG) parts.push(`${n.proteinG} g protein`);
  if (n.fatG) parts.push(`${n.fatG} g fat`);
  if (n.fluidsMl) parts.push(`${n.fluidsMl} ml`);
  if (n.sodiumMg) parts.push(`${n.sodiumMg} mg Na`);
  if (n.caffeineMg) parts.push(`${n.caffeineMg} mg caffeine`);
  if (n.kcal) parts.push(`${n.kcal} kcal`);
  return parts.join(' · ');
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function itemTime(
  raceDate: string | null,
  startTime: string | null,
  offsetMin: number,
  label: string,
): string {
  if (!raceDate || !startTime) return label;
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date(`${raceDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return label;
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + offsetMin);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
