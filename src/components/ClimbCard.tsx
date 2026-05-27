import { gradientZone, ZONE_COLOR, CAT_COLOR, smoothedSlopePct, type ElevationPoint, type Climb } from '../lib/gpx';

const W = 1000;
const H = 420;
const PAD = { top: 10, right: 68, bottom: 10, left: 6 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceElevStep(range: number): number {
  if (range <= 150) return 50;
  if (range <= 400) return 100;
  if (range <= 800) return 200;
  return 500;
}

function nearestPt(pts: ElevationPoint[], distKm: number): ElevationPoint {
  let lo = 0, hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].distanceKm < distKm) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(pts[lo - 1].distanceKm - distKm) < Math.abs(pts[lo].distanceKm - distKm)) {
    return pts[lo - 1];
  }
  return pts[lo];
}

type KmSeg = { label: string; segKm: number; gradPct: number; zone: ReturnType<typeof gradientZone> };

function buildKmSegs(points: ElevationPoint[], startDist: number, endDist: number): KmSeg[] {
  const totalKm = endDist - startDist;
  if (totalKm <= 0) return [];
  const step = totalKm > 25 ? 3 : totalKm > 15 ? 2 : 1;
  const segs: KmSeg[] = [];
  for (let k = 0; k * step < totalKm; k++) {
    const d0 = startDist + k * step;
    const d1 = Math.min(d0 + step, endDist);
    const p0 = nearestPt(points, d0);
    const p1 = nearestPt(points, d1);
    const elevDiff = p1.elevationM - p0.elevationM;
    const distM = (d1 - d0) * 1000;
    const gradPct = distM > 1 ? (elevDiff / distM) * 100 : 0;
    segs.push({
      label: String(Math.min(Math.round((k + 1) * step), Math.ceil(totalKm))),
      segKm: d1 - d0,
      gradPct: Math.round(gradPct * 10) / 10,
      zone: gradientZone(gradPct),
    });
  }
  return segs;
}

interface Props {
  climb: Climb;
  index: number;
  points: ElevationPoint[];
}

export default function ClimbCard({ climb, index, points }: Props) {
  const climbPts = points.filter(
    (p) => p.distanceKm >= climb.startDistKm - 0.15 && p.distanceKm <= climb.endDistKm + 0.15,
  );
  if (climbPts.length < 2) return null;

  const kmSegs = buildKmSegs(points, climb.startDistKm, climb.endDistKm);
  const sd = climbPts[0].distanceKm;
  const ed = climbPts[climbPts.length - 1].distanceKm;
  const lenKm = ed - sd;

  const elevs = climbPts.map((p) => p.elevationM);
  const minElev = Math.min(...elevs);
  const maxElev = Math.max(...elevs);
  const elevRange = maxElev - minElev || 1;

  const xF = (d: number) => PAD.left + ((d - sd) / lenKm) * PLOT_W;
  const yF = (e: number) => PAD.top + PLOT_H - ((e - minElev) / elevRange) * PLOT_H;
  const baseY = PAD.top + PLOT_H;

  // Gradient-coloured trapezoid fill — one per segment
  const traps = climbPts.slice(0, -1).map((p1, i) => {
    const p2 = climbPts[i + 1];
    const zone = gradientZone(smoothedSlopePct(climbPts, i));
    return {
      d: `M ${xF(p1.distanceKm)} ${yF(p1.elevationM)} L ${xF(p2.distanceKm)} ${yF(p2.elevationM)} L ${xF(p2.distanceKm)} ${baseY} L ${xF(p1.distanceKm)} ${baseY} Z`,
      color: ZONE_COLOR[zone],
    };
  });

  const profileD = climbPts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${xF(p.distanceKm)} ${yF(p.elevationM)}`,
  ).join(' ');

  // Right-side elevation ticks
  const elevStep = niceElevStep(elevRange);
  const elevTicks: number[] = [];
  for (let e = Math.ceil(minElev / elevStep) * elevStep; e <= maxElev; e += elevStep) elevTicks.push(e);

  const catColor = CAT_COLOR[climb.category];
  const catLabel = climb.category === 'HC' ? 'HC' : `Cat ${climb.category}`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {/* Header */}
      <div className="border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: catColor }}>
            {catLabel}
          </span>
          <span className="text-sm font-semibold text-zinc-800">Climb {index + 1}</span>
          <span className="ml-auto text-xs text-zinc-400">at {climb.endDistKm.toFixed(1)} km</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          +{climb.elevationGainM} m · {climb.lengthKm} km · {climb.avgGradientPct}% avg · {climb.maxGradientPct}% max
        </p>
      </div>

      {/* Elevation profile */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`Climb ${index + 1} elevation`}>
        {elevTicks.map((e, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yF(e)} x2={W - PAD.right + 4} y2={yF(e)} stroke="#e4e4e7" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x={W - PAD.right + 8} y={yF(e)} dominantBaseline="middle" fontSize="13" fill="#a1a1aa">{Math.round(e)} m</text>
          </g>
        ))}

        {traps.map((t, i) => <path key={i} d={t.d} fill={t.color} fillOpacity="0.85" />)}

        <path d={profileD} fill="none" stroke="#18181b" strokeWidth="1.2" strokeLinejoin="round" opacity="0.4" />

        <line x1={xF(sd)} y1={baseY} x2={xF(ed)} y2={baseY} stroke="#d4d4d8" strokeWidth="0.8" />
      </svg>

      {/* Per-km gradient breakdown */}
      <div className="flex gap-1 border-t border-zinc-100 bg-zinc-50 p-1.5">
        {kmSegs.map((seg, i) => (
          <div key={i} className="flex min-w-0 flex-col overflow-hidden rounded-sm" style={{ flex: seg.segKm }}>
            <div
              className="flex items-center justify-center py-1.5 text-[9px] font-bold leading-none text-white"
              style={{ backgroundColor: ZONE_COLOR[seg.zone] }}
            >
              {seg.gradPct}%
            </div>
            <div className="bg-white pb-1 pt-0.5 text-center text-[9px] text-zinc-400">{seg.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
