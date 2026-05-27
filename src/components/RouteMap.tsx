import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function RouteMap({ track }: { track: [number, number][] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || track.length === 0) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    const line = L.polyline(track, { color: '#f59e0b', weight: 4, opacity: 0.95 }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [24, 24] });

    const start = track[0];
    const end = track[track.length - 1];
    L.circleMarker(start, {
      radius: 6,
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    L.circleMarker(end, {
      radius: 6,
      color: '#fafafa',
      fillColor: '#18181b',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [track]);

  return <div ref={containerRef} className="h-72 w-full rounded-xl" />;
}
