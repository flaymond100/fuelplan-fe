import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RouteMap, { type RouteMapHandle } from '../components/RouteMap';
import ElevationProfile from '../components/ElevationProfile';
import ClimbCard from '../components/ClimbCard';
import PlanDays from '../components/PlanDays';
import TrainingLoadPanel from '../components/TrainingLoadPanel';
import { Card, SectionCard, StatCard } from '../components/ui';
import { usePlan, useRouteTrack } from '../hooks/usePlans';
import { useWeather } from '../hooks/useWeather';
import { degToCompass } from '../lib/weather';
import { bearingDeg, estimateDraft, type DraftEstimate } from '../lib/draft';
import { formatDate } from '../lib/profileFormat';

export default function PlanView() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading, isError } = usePlan(id);

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-3xl bg-white/60 p-12 text-center text-sm text-zinc-500 ring-1 ring-white/70 backdrop-blur-xl">
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

  // KPI strip shows in-race fuelling only (the `race` phase), not the whole
  // multi-day plan. Falls back to plan totals if there's no race phase.
  const racePhases = p.phases.filter((ph) => ph.id === 'race');
  const raceTotals = racePhases.length
    ? racePhases.reduce(
        (acc, ph) => ({
          carbsG: acc.carbsG + ph.totals.carbsG,
          fluidsMl: acc.fluidsMl + ph.totals.fluidsMl,
          sodiumMg: acc.sodiumMg + ph.totals.sodiumMg,
          caffeineMg: acc.caffeineMg + ph.totals.caffeineMg,
          kcal: acc.kcal + ph.totals.kcal,
        }),
        { carbsG: 0, fluidsMl: 0, sodiumMg: 0, caffeineMg: 0, kcal: 0 },
      )
    : p.totals;

  return (
    <div className="space-y-6 text-zinc-900">
      <BackLink />

      {/* Hero */}
      <div>
        {tagline && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{tagline}</p>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {plan.race_name ?? 'Your plan'}
        </h1>
        {p.summary && <p className="mt-3 max-w-3xl text-zinc-600">{p.summary}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {plan.race_date && <Pill>{formatDate(plan.race_date)}</Pill>}
          {plan.distance_km != null && <Pill>{plan.distance_km} km</Pill>}
          {plan.elevation_m != null && <Pill>{plan.elevation_m} m climb</Pill>}
          <Pill>Est. {formatDuration(p.estimatedDurationMin)}</Pill>
        </div>
      </div>

      {/* In-race fuelling totals (the race phase only, not the whole plan) */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          During the race
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Carbs" value={raceTotals.carbsG.toLocaleString()} unit="g" icon={<CarbsIcon />} />
          <StatCard label="Fluids" value={raceTotals.fluidsMl.toLocaleString()} unit="ml" icon={<FluidIcon />} />
          <StatCard label="Sodium" value={raceTotals.sodiumMg.toLocaleString()} unit="mg" icon={<SaltIcon />} />
          <StatCard label="Caffeine" value={raceTotals.caffeineMg.toLocaleString()} unit="mg" icon={<CaffeineIcon />} />
          <StatCard label="Energy" value={raceTotals.kcal.toLocaleString()} unit="kcal" icon={<FlameIcon />} />
        </div>
      </div>

      {/* Details: route map (left) · climbs + weather (right sidebar) */}
      <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
        <div className="xl:col-span-2">
          <RouteSection
            id={id}
            lat={rp.gpxMeta?.startLat}
            lng={rp.gpxMeta?.startLng}
            date={plan.race_date}
            distanceKm={plan.distance_km}
            durationMin={p.estimatedDurationMin}
            discipline={rp.discipline}
          />
        </div>
        <div className="space-y-4">
          <ClimbBreakdown id={id} />
          <WeatherSection
            lat={rp.gpxMeta?.startLat}
            lng={rp.gpxMeta?.startLng}
            date={plan.race_date}
          />
        </div>
      </div>

      {/* Training — last 14 days */}
      <TrainingLoadPanel />

      {/* Nutrition by day */}
      <PlanDays plan={plan} />
    </div>
  );
}

function RouteSection({
  id,
  lat,
  lng,
  date,
  distanceKm,
  durationMin,
  discipline,
}: {
  id: string | undefined;
  lat: number | undefined;
  lng: number | undefined;
  date: string | null;
  distanceKm: number | null;
  durationMin: number;
  discipline: string | undefined;
}) {
  const { data, isLoading, isError } = useRouteTrack(id);
  const mapRef = useRef<RouteMapHandle>(null);
  const handleHover = useCallback((latlng: [number, number] | null) => {
    mapRef.current?.setCursor(latlng);
  }, []);
  const hasCoords = lat != null && lng != null && (lat !== 0 || lng !== 0);
  const { data: weatherData } = useWeather(hasCoords ? lat : null, hasCoords ? lng : null, date ?? '');
  const wind = weatherData?.kind === 'forecast'
    ? { directionDeg: weatherData.data.windDirectionDeg, speedKmh: weatherData.data.windSpeedMaxKmh }
    : null;

  const track = data?.track;
  const windDir = wind?.directionDeg ?? null;
  const windSpeed = wind?.speedKmh ?? null;
  const draft = useMemo(() => {
    if (discipline !== 'cycling' || windDir == null || windSpeed == null || !track || track.length < 2 || !distanceKm || durationMin <= 0) {
      return null;
    }
    const routeBearing = bearingDeg(track[0], track[track.length - 1]);
    const speedKmh = distanceKm / (durationMin / 60);
    return estimateDraft(windDir, windSpeed, routeBearing, speedKmh);
  }, [discipline, windDir, windSpeed, track, distanceKm, durationMin]);

  if (isLoading) {
    return (
      <SectionCard title="Route">
        <div className="grid h-128 w-full place-items-center rounded-2xl bg-white/40 text-sm text-zinc-500">
          Loading route…
        </div>
      </SectionCard>
    );
  }
  if (isError || !data || data.track.length === 0) {
    return (
      <SectionCard title="Route">
        <div className="grid h-128 w-full place-items-center rounded-2xl bg-white/40 text-sm text-zinc-500">
          Route map unavailable.
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Route">
      {draft && <DraftCard draft={draft} />}

      <RouteMap ref={mapRef} track={data.track} profile={data.profile} wind={wind} />
      {data.profile && data.profile.length >= 2 && (
        <ElevationProfile points={data.profile} climbs={data.climbs} onHover={handleHover} />
      )}
    </SectionCard>
  );
}

/** Climb breakdown — collapsible card, lives in the right sidebar beside the map. */
function ClimbBreakdown({ id }: { id: string | undefined }) {
  const { data } = useRouteTrack(id);
  const [open, setOpen] = useState(true);
  if (!data?.profile || data.climbs.length === 0) return null;
  return (
    <Card className="p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="text-base font-semibold text-zinc-900">Climb breakdown</h2>
        <span className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          {data.climbs.length} {data.climbs.length === 1 ? 'climb' : 'climbs'}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 text-zinc-400 transition-transform group-hover:text-zinc-700 ${open ? 'rotate-90' : ''}`}
          >
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {data.climbs.map((climb, i) => (
            <ClimbCard key={i} climb={climb} index={i} points={data.profile!} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DraftCard({ draft }: { draft: DraftEstimate }) {
  const head = Math.round(Math.abs(draft.headwindKmh));
  const relationCopy =
    draft.relation === 'headwind'
      ? `~${head} km/h average headwind — aero is a big share of your effort, so the wheel matters most here.`
      : draft.relation === 'tailwind'
      ? `~${head} km/h average tailwind — air resistance is low, so drafting saves less than usual.`
      : 'Mostly crosswind — echelon positioning helps more than sitting directly on a wheel.';

  return (
    <div className="mt-4 mb-8 flex items-center gap-4 rounded-2xl bg-white/55 p-4 ring-1 ring-white/60">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h9a2.5 2.5 0 1 1-2.5 2.5" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Drafting saving</p>
        <p className="mt-0.5 text-lg font-bold text-zinc-900">
          ~{draft.wattsSaved} W
          <span className="ml-1.5 text-sm font-medium text-zinc-500">
            sitting in a group vs. solo @ {Math.round(draft.speedKmh)} km/h
          </span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{relationCopy}</p>
      </div>
    </div>
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
      <SectionCard title="Race-day weather">
        <p className="text-sm text-zinc-600">
          Forecast available closer to race day — {data.daysAway} days out.
        </p>
      </SectionCard>
    );
  }

  const f = data.data;
  return (
    <SectionCard title="Race-day weather">
      <div className="grid grid-cols-2 gap-3">
      <WeatherTile
        label="Conditions"
        main={weatherLabel(f.weatherCode)}
        icon={<WeatherIcon code={f.weatherCode} />}
      />
      <WeatherTile
        label="Temp"
        main={`${Math.round(f.tempMaxC)}° / ${Math.round(f.tempMinC)}°`}
        icon={<Thermometer tempMaxC={f.tempMaxC} />}
      />
      <WeatherTile
        label="Wind"
        main={`${Math.round(f.windSpeedMaxKmh)} km/h`}
        sub={`from ${degToCompass(f.windDirectionDeg)}`}
        icon={
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-brand-600"
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
    </SectionCard>
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
    <div className="rounded-2xl bg-white/55 px-4 py-3 ring-1 ring-white/60">
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
    <span className="rounded-full bg-white/70 px-3 py-1 text-sm text-zinc-700 ring-1 ring-white/80">
      {children}
    </span>
  );
}

function WeatherIcon({ code }: { code: number }) {
  const cls = 'h-6 w-6';
  // Clear
  if (code === 0) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} text-amber-400`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>
    );
  }
  // Partly cloudy
  if (code <= 3) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} text-zinc-400`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3.2" className="text-amber-400" stroke="#fbbf24" />
        <path d="M17.5 19a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.6 1.2A3.5 3.5 0 0 0 8.5 19Z" />
      </svg>
    );
  }
  // Fog
  if (code <= 48) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} text-zinc-400`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h13a3.5 3.5 0 1 0-3.4-4.3" />
        <path d="M3 13h16M5 17h14M7 21h10" />
      </svg>
    );
  }
  // Rain / showers
  if (code <= 67 || (code >= 80 && code <= 82)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} text-sky-400`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 15a4.5 4.5 0 0 1 1-8.8 5.5 5.5 0 0 1 10.5 1.8A3.5 3.5 0 0 1 18 15Z" />
        <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
      </svg>
    );
  }
  // Snow / snow showers
  if (code <= 77 || (code >= 85 && code <= 86)) {
    return (
      <svg viewBox="0 0 24 24" className={`${cls} text-sky-300`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 14a4.5 4.5 0 0 1 1-8.8 5.5 5.5 0 0 1 10.5 1.8A3.5 3.5 0 0 1 18 14Z" />
        <path d="M9 18.5h.01M12 20.5h.01M15 18.5h.01" />
      </svg>
    );
  }
  // Thunderstorm
  return (
    <svg viewBox="0 0 24 24" className={`${cls} text-amber-500`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 14a4.5 4.5 0 0 1 1-8.8 5.5 5.5 0 0 1 10.5 1.8A3.5 3.5 0 0 1 18 14Z" />
      <path d="M12 13l-2 4h3l-2 4" />
    </svg>
  );
}

function Thermometer({ tempMaxC }: { tempMaxC: number }) {
  const color = tempMaxC >= 28 ? 'text-rose-500' : tempMaxC >= 22 ? 'text-amber-400' : tempMaxC >= 15 ? 'text-emerald-400' : 'text-sky-400';
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0Z" />
      <path d="M12 9v6.5" />
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

// ── KPI tile icons (inherit IconBadge's neutral colour via currentColor) ──────

function CarbsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V8" />
      <path d="M12 8c0-2 1.6-3.6 3.6-3.6C15.6 6.4 14 8 12 8Z" />
      <path d="M12 8c0-2-1.6-3.6-3.6-3.6C8.4 6.4 10 8 12 8Z" />
      <path d="M12 14c0-2 1.6-3.6 3.6-3.6C15.6 12.4 14 14 12 14Z" />
      <path d="M12 14c0-2-1.6-3.6-3.6-3.6C8.4 12.4 10 14 12 14Z" />
    </svg>
  );
}

function FluidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5Z" />
    </svg>
  );
}

function SaltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 9.5 8.7 21h6.6L16 9.5Z" />
      <path d="M8 9.5a4 4 0 0 1 8 0Z" />
      <path d="M11 5V3.5h2V5" />
    </svg>
  );
}

function CaffeineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8.5 3c-.5 1 .5 1.5 0 2.5M11.5 3c-.5 1 .5 1.5 0 2.5" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.6 1-3.2.5 1 1.4 1.5 2 1.5C11.5 7.4 11 5.2 12 3Z" />
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

