import { useRef } from 'react';
import { gradientZone, ZONE_COLOR, CAT_COLOR, smoothedSlopePct, type ElevationPoint, type Climb } from '../lib/gpx';

const W = 1000;
const H = 230;
const PAD = { top: 56, right: 16, bottom: 36, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceTick(maxDist: number): number {
  if (maxDist <= 20) return 5;
  if (maxDist <= 50) return 10;
  if (maxDist <= 100) return 20;
  if (maxDist <= 200) return 25;
  return 50;
}

function nearestIdx(points: ElevationPoint[], distKm: number): number {
  let lo = 0, hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].distanceKm < distKm) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].distanceKm - distKm) < Math.abs(points[lo].distanceKm - distKm)) {
    return lo - 1;
  }
  return lo;
}

interface Props {
  points: ElevationPoint[];
  climbs: Climb[];
  onHover?: (latlng: [number, number] | null) => void;
}

export default function ElevationProfile({ points, climbs, onHover }: Props) {
  const cursorLineRef = useRef<SVGLineElement>(null);
  const cursorDotRef = useRef<SVGCircleElement>(null);
  const tooltipRef = useRef<SVGGElement>(null);
  const tooltipTextRef = useRef<SVGTextElement>(null);

  const maxDist = points[points.length - 1].distanceKm;
  const elevs = points.map((p) => p.elevationM);
  const minElev = Math.min(...elevs);
  const maxElev = Math.max(...elevs);
  const elevRange = maxElev - minElev || 1;

  const xScale = (d: number) => PAD.left + (d / maxDist) * PLOT_W;
  const yScale = (e: number) => PAD.top + PLOT_H - ((e - minElev) / elevRange) * PLOT_H;
  const baseY = PAD.top + PLOT_H;

  const profilePath = [
    `M ${xScale(points[0].distanceKm)} ${yScale(points[0].elevationM)}`,
    ...points.slice(1).map((p) => `L ${xScale(p.distanceKm)} ${yScale(p.elevationM)}`),
  ].join(' ');

  const tickInterval = niceTick(maxDist);
  const ticks: number[] = [];
  for (let t = tickInterval; t < maxDist - tickInterval * 0.4; t += tickInterval) ticks.push(t);

  const gridElevs = [minElev, minElev + elevRange * 0.5, maxElev];

  type TrapSeg = { d: string; color: string };
  const trapezoids: TrapSeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const x1 = xScale(p1.distanceKm), y1 = yScale(p1.elevationM);
    const x2 = xScale(p2.distanceKm), y2 = yScale(p2.elevationM);
    const zone = gradientZone(smoothedSlopePct(points, i));
    trapezoids.push({ d: `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${baseY} L ${x1} ${baseY} Z`, color: ZONE_COLOR[zone] });
  }

  // Imperative hover — zero React re-renders on mousemove
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const distKm = Math.max(0, Math.min(maxDist, ((svgX - PAD.left) / PLOT_W) * maxDist));
    const idx = nearestIdx(points, distKm);
    const pt = points[idx];
    const x = xScale(pt.distanceKm);
    const y = yScale(pt.elevationM);
    const slope = smoothedSlopePct(points, idx);
    const slopeStr = `${slope >= 0 ? '+' : ''}${slope.toFixed(1)}%`;

    cursorLineRef.current?.setAttribute('x1', String(x));
    cursorLineRef.current?.setAttribute('x2', String(x));
    cursorLineRef.current?.setAttribute('visibility', 'visible');
    cursorDotRef.current?.setAttribute('cx', String(x));
    cursorDotRef.current?.setAttribute('cy', String(y));
    cursorDotRef.current?.setAttribute('visibility', 'visible');

    if (tooltipRef.current && tooltipTextRef.current) {
      tooltipTextRef.current.textContent = `${pt.distanceKm.toFixed(1)} km · ${Math.round(pt.elevationM)} m · ${slopeStr}`;
      // Half-width must match the rect below (110 units each side = 220 total)
      const tx = Math.min(Math.max(x, PAD.left + 110), W - PAD.right - 110);
      tooltipRef.current.setAttribute('transform', `translate(${tx}, ${Math.max(PAD.top + 4, y - 24)})`);
      tooltipRef.current.setAttribute('visibility', 'visible');
    }

    onHover?.([pt.lat, pt.lng]);
  };

  const handleMouseLeave = () => {
    cursorLineRef.current?.setAttribute('visibility', 'hidden');
    cursorDotRef.current?.setAttribute('visibility', 'hidden');
    tooltipRef.current?.setAttribute('visibility', 'hidden');
    onHover?.(null);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-white">
      <div className="flex items-center justify-between px-4 pb-0 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Elevation profile
        </p>
        <div className="flex items-center gap-3">
          {(['easy', 'moderate', 'steep', 'very-steep'] as const).map((z) => (
            <span key={z} className="flex items-center gap-1 text-[9px] font-medium text-zinc-500">
              <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: ZONE_COLOR[z] }} />
              {z === 'easy' ? '<5%' : z === 'moderate' ? '5–8%' : z === 'steep' ? '8–12%' : '>12%'}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair"
        aria-label="Route elevation profile"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {gridElevs.map((e, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yScale(e)} x2={W - PAD.right} y2={yScale(e)} stroke="#e4e4e7" strokeWidth="0.8" strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={yScale(e)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#a1a1aa">{Math.round(e)}</text>
          </g>
        ))}

        {trapezoids.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color} fillOpacity="0.85" />
        ))}

        <path d={profilePath} fill="none" stroke="#18181b" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.4" />

        <circle cx={xScale(0)} cy={yScale(points[0].elevationM)} r="5" fill="#18181b" />
        <text x={xScale(0) + 8} y={yScale(points[0].elevationM) - 8} fontSize="11" fontWeight="600" fill="#18181b">S</text>
        <circle cx={xScale(maxDist)} cy={yScale(points[points.length - 1].elevationM)} r="5" fill="#18181b" />
        <text x={xScale(maxDist) - 8} y={yScale(points[points.length - 1].elevationM) - 8} fontSize="11" fontWeight="600" fill="#18181b" textAnchor="end">F</text>

        <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY} stroke="#d4d4d8" strokeWidth="0.8" />

        {ticks.map((t) => (
          <g key={t}>
            <line x1={xScale(t)} y1={baseY} x2={xScale(t)} y2={baseY + 5} stroke="#a1a1aa" strokeWidth="0.8" />
            <text x={xScale(t)} y={baseY + 16} textAnchor="middle" fontSize="11" fill="#a1a1aa">{t} km</text>
          </g>
        ))}
        <text x={PAD.left} y={baseY + 16} textAnchor="middle" fontSize="11" fill="#a1a1aa">0</text>
        <text x={W - PAD.right} y={baseY + 16} textAnchor="end" fontSize="11" fill="#a1a1aa">{maxDist.toFixed(1)} km</text>

        {/* Climb badges */}
        {climbs.map((climb, i) => {
          const sx = xScale(climb.endDistKm);
          const summitElev = points[nearestIdx(points, climb.endDistKm)].elevationM;
          const sy = yScale(summitElev);
          const color = CAT_COLOR[climb.category];
          const label = climb.category === 'HC' ? 'HC' : `Cat ${climb.category}`;
          const bx = Math.min(Math.max(sx, PAD.left + 30), W - PAD.right - 30);
          return (
            <g key={i}>
              <line x1={bx} y1={48} x2={sx} y2={sy} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
              <rect x={bx - 30} y={4} width={60} height={42} rx="4" fill={color} />
              <text x={bx} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{label}</text>
              <text x={bx} y={31} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)">{climb.lengthKm} km · {climb.avgGradientPct}%</text>
              <text x={bx} y={42} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.75)">max {climb.maxGradientPct}%</text>
              <circle cx={sx} cy={sy} r="4" fill={color} stroke="white" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Cursor */}
        <line ref={cursorLineRef} x1={0} y1={PAD.top} x2={0} y2={baseY} stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" visibility="hidden" pointerEvents="none" />
        <circle ref={cursorDotRef} cx={0} cy={0} r="5" fill="#fbbf24" stroke="white" strokeWidth="1.5" visibility="hidden" pointerEvents="none" />
        <g ref={tooltipRef} visibility="hidden" pointerEvents="none">
          <rect x={-110} y={-11} width={220} height={20} rx="3" fill="#18181b" fillOpacity="0.88" />
          <text ref={tooltipTextRef} x={0} y={4} textAnchor="middle" fontSize="11" fill="white" fontWeight="500" />
        </g>
      </svg>
    </div>
  );
}
