import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gradientZone, ZONE_COLOR, smoothedSlopePct, type ElevationPoint } from '../lib/gpx';

export type RouteMapHandle = {
  setCursor: (latlng: [number, number] | null) => void;
};

interface Props {
  track: [number, number][];
  profile?: ElevationPoint[] | null;
}

const RouteMap = forwardRef<RouteMapHandle, Props>(({ track, profile }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<L.CircleMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

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
      cursorRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [track, profile]);

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
    </div>
  );
});

RouteMap.displayName = 'RouteMap';
export default RouteMap;
