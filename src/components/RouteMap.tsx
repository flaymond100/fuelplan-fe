import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gradientZone, ZONE_COLOR, smoothedSlopePct, type ElevationPoint } from '../lib/gpx';
import { degToCompass } from '../lib/weather';

export type RouteMapHandle = {
  setCursor: (latlng: [number, number] | null) => void;
};

interface Props {
  track: [number, number][];
  profile?: ElevationPoint[] | null;
  wind?: { directionDeg: number; speedKmh: number } | null;
}

const RouteMap = forwardRef<RouteMapHandle, Props>(({ track, profile, wind }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<L.CircleMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const windMarkersRef = useRef<L.Marker[]>([]);

  useImperativeHandle(ref, () => ({
    setCursor(latlng) {
      const m = cursorRef.current;
      if (!m) return;
      if (latlng === null) {
        m.setStyle({ opacity: 0, fillOpacity: 0 });
      } else {
        m.setLatLng(latlng);
        m.setStyle({ opacity: 1, fillOpacity: 1 });
      }
    },
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || track.length === 0) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    if (profile && profile.length >= 2) {
      // Gradient-coloured polyline segments grouped by zone
      let zoneStart = 0;
      let currentZone = gradientZone(smoothedSlopePct(profile, 0));

      const flush = (endIdx: number) => {
        const pts = profile.slice(zoneStart, endIdx + 1).map((p): [number, number] => [p.lat, p.lng]);
        if (pts.length >= 2) {
          L.polyline(pts, { color: ZONE_COLOR[currentZone], weight: 4, opacity: 0.95 }).addTo(map);
        }
      };

      for (let i = 1; i < profile.length; i++) {
        const zone = gradientZone(smoothedSlopePct(profile, i));
        if (zone !== currentZone) { flush(i); zoneStart = i; currentZone = zone; }
      }
      flush(profile.length - 1);

      map.fitBounds(L.latLngBounds(profile.map((p) => [p.lat, p.lng])), { padding: [24, 24] });
    } else {
      const line = L.polyline(track, { color: '#f59e0b', weight: 4, opacity: 0.95 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [24, 24] });
    }

    const start = track[0];
    const end = track[track.length - 1];
    L.circleMarker(start, { radius: 6, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }).addTo(map);
    L.circleMarker(end, { radius: 6, color: '#fafafa', fillColor: '#18181b', fillOpacity: 1, weight: 2 }).addTo(map);

    const cursor = L.circleMarker([0, 0], {
      radius: 7, color: '#ffffff', fillColor: '#f59e0b', fillOpacity: 0, opacity: 0, weight: 2,
    }).addTo(map);
    cursorRef.current = cursor;

    return () => {
      windMarkersRef.current = [];
      cursorRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [track, profile]);

  // Separate effect so wind arrows update without recreating the map
  useEffect(() => {
    windMarkersRef.current.forEach((m) => m.remove());
    windMarkersRef.current = [];

    const map = mapRef.current;
    if (!map || !wind) return;

    const pts: [number, number][] =
      profile && profile.length >= 2
        ? profile.map((p) => [p.lat, p.lng])
        : track;

    const count = 5;
    const step = Math.max(1, Math.floor(pts.length / (count + 1)));
    const rotateDeg = wind.directionDeg + 180;
    const arrowHtml = `<div style="width:30px;height:30px;background:rgba(255,255,255,0.92);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 5px rgba(0,0,0,0.22);transform:rotate(${rotateDeg}deg)"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M6 9l6-6 6 6"/></svg></div>`;

    for (let i = 1; i <= count; i++) {
      const pt = pts[Math.min(i * step, pts.length - 1)];
      const marker = L.marker(pt, {
        icon: L.divIcon({ html: arrowHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] }),
        interactive: false,
      }).addTo(map);
      windMarkersRef.current.push(marker);
    }
  }, [wind, track, profile]);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-72 w-full rounded-xl" />
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-semibold text-zinc-700 shadow-md transition hover:bg-zinc-50 active:scale-95"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-semibold text-zinc-700 shadow-md transition hover:bg-zinc-50 active:scale-95"
        >
          −
        </button>
      </div>
      {wind && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `rotate(${wind.directionDeg + 180}deg)` }}
          >
            <path d="M12 3v18M6 9l6-6 6 6" />
          </svg>
          <div>
            <p className="text-xs font-semibold leading-none text-zinc-800">
              {Math.round(wind.speedKmh)} km/h
            </p>
            <p className="mt-0.5 text-[10px] leading-none text-zinc-500">
              from {degToCompass(wind.directionDeg)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

RouteMap.displayName = 'RouteMap';
export default RouteMap;
