export type GpxSummary = {
  distanceKm: number;
  elevationGainM: number;
  startLat: number;
  startLng: number;
  pointCount: number;
};

export async function parseGpx(file: File): Promise<GpxSummary> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error("That doesn't look like a valid GPX file.");
  }

  const points = Array.from(doc.querySelectorAll('trkpt'));
  if (points.length === 0) {
    throw new Error('No track points found in the GPX file.');
  }

  let distanceM = 0;
  let elevationGainM = 0;
  let prevLat: number | null = null;
  let prevLng: number | null = null;
  let prevEle: number | null = null;

  for (const pt of points) {
    const lat = Number(pt.getAttribute('lat'));
    const lng = Number(pt.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const eleNode = pt.querySelector('ele');
    const ele = eleNode ? Number(eleNode.textContent) : null;

    if (prevLat !== null && prevLng !== null) {
      distanceM += haversine(prevLat, prevLng, lat, lng);
    }
    if (ele !== null && Number.isFinite(ele) && prevEle !== null && ele > prevEle) {
      elevationGainM += ele - prevEle;
    }

    prevLat = lat;
    prevLng = lng;
    if (ele !== null && Number.isFinite(ele)) prevEle = ele;
  }

  const first = points[0];
  const startLat = Number(first.getAttribute('lat'));
  const startLng = Number(first.getAttribute('lon'));

  return {
    distanceKm: Number((distanceM / 1000).toFixed(1)),
    elevationGainM: Math.round(elevationGainM),
    startLat,
    startLng,
    pointCount: points.length,
  };
}

export type ElevationPoint = {
  distanceKm: number;
  elevationM: number;
  lat: number;
  lng: number;
};

export type GradientZone = 'downhill' | 'flat' | 'easy' | 'moderate' | 'steep' | 'very-steep';

export function gradientZone(slopePct: number): GradientZone {
  if (slopePct < -1) return 'downhill';
  if (slopePct < 2) return 'flat';
  if (slopePct < 5) return 'easy';
  if (slopePct < 8) return 'moderate';
  if (slopePct < 12) return 'steep';
  return 'very-steep';
}

export const ZONE_COLOR: Record<GradientZone, string> = {
  downhill: '#93c5fd', // blue
  flat: '#6b7280',     // grey
  easy: '#22c55e',     // green
  moderate: '#f59e0b', // amber
  steep: '#f97316',    // orange
  'very-steep': '#ef4444', // red
};

export type ClimbCategory = 'HC' | '1' | '2' | '3' | '4';

export const CAT_COLOR: Record<ClimbCategory, string> = {
  HC: '#991b1b',
  '1': '#dc2626',
  '2': '#ea580c',
  '3': '#16a34a',
  '4': '#4d7c0f',
};

export type Climb = {
  startDistKm: number;
  endDistKm: number;
  peakLat: number;
  peakLng: number;
  elevationGainM: number;
  avgGradientPct: number;
  maxGradientPct: number;
  lengthKm: number;
  category: ClimbCategory;
};

function climbCategory(gainM: number, avgGrad: number): ClimbCategory | null {
  if (gainM < 75) return null;
  const score = gainM * avgGrad;
  if (score >= 8000 || gainM >= 1500) return 'HC';
  if (score >= 3000 || gainM >= 700) return '1';
  if (score >= 1200 || gainM >= 350) return '2';
  if (score >= 350 || gainM >= 150) return '3';
  if (score >= 80) return '4';
  return null;
}

/**
 * Extracts a downsampled elevation profile from GPX text including lat/lng for map linking.
 * Returns null when the file contains no elevation data.
 */
export function extractElevationProfile(text: string, maxPoints = 500): ElevationPoint[] | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) return null;

  const rawPts = Array.from(doc.querySelectorAll('trkpt'));
  if (rawPts.length === 0) return null;

  const pts: { distanceM: number; elevationM: number; lat: number; lng: number }[] = [];
  let cumulativeM = 0;
  let prevLat: number | null = null;
  let prevLng: number | null = null;

  for (const pt of rawPts) {
    const lat = Number(pt.getAttribute('lat'));
    const lng = Number(pt.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    if (prevLat !== null && prevLng !== null) {
      cumulativeM += haversine(prevLat, prevLng, lat, lng);
    }
    prevLat = lat;
    prevLng = lng;

    const eleNode = pt.querySelector('ele');
    const ele = eleNode ? Number(eleNode.textContent) : null;
    if (ele === null || !Number.isFinite(ele)) continue;
    pts.push({ distanceM: cumulativeM, elevationM: ele, lat, lng });
  }

  if (pts.length < 2) return null;

  const step = Math.max(1, Math.ceil(pts.length / maxPoints));
  const out: ElevationPoint[] = [];
  for (let i = 0; i < pts.length; i += step) {
    out.push({
      distanceKm: pts[i].distanceM / 1000,
      elevationM: pts[i].elevationM,
      lat: pts[i].lat,
      lng: pts[i].lng,
    });
  }
  const last = pts[pts.length - 1];
  const lastOut = out[out.length - 1];
  if (lastOut.distanceKm !== last.distanceM / 1000) {
    out.push({ distanceKm: last.distanceM / 1000, elevationM: last.elevationM, lat: last.lat, lng: last.lng });
  }
  return out;
}

/**
 * Detects categorised climbs in an elevation profile.
 * Uses a state machine with smoothed gradients to find sustained uphill sections.
 */
export function detectClimbs(points: ElevationPoint[]): Climb[] {
  if (points.length < 10) return [];

  const N = points.length;

  // Smooth elevations (7-point moving average)
  const smoothElev = points.map((_, i) => {
    const half = 3;
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(N - 1, i + half); j++) {
      sum += points[j].elevationM; count++;
    }
    return sum / count;
  });

  // Per-segment gradient (%) between consecutive smoothed points
  const seg = new Array<number>(N - 1);
  for (let i = 0; i < N - 1; i++) {
    const dDist = (points[i + 1].distanceKm - points[i].distanceKm) * 1000;
    seg[i] = dDist > 1 ? ((smoothElev[i + 1] - smoothElev[i]) / dDist) * 100 : 0;
  }

  // Smooth segment gradients (5-point moving average)
  const smoothSeg = seg.map((_, i) => {
    const half = 2;
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(seg.length - 1, i + half); j++) {
      sum += seg[j]; count++;
    }
    return sum / count;
  });

  const CLIMB_START = 1.5;       // % slope to enter a climb
  const CLIMB_END = -0.5;        // % slope to start counting "rest"
  const MAX_REST_KM = 1.0;       // max rest/descent distance before ending climb
  const MIN_GAIN_M = 75;

  type State = 'idle' | 'climbing' | 'resting';

  const climbs: Climb[] = [];
  let state: State = 'idle';
  let climbStartIdx = 0;
  let restStartIdx = 0;
  let peakIdx = 0;
  let maxGrad = 0;

  function finishClimb(endIdx: number) {
    // Trim leading 1km segments that average < 4% — approach roads shouldn't count
    const TRIM_THRESHOLD = 4.0;
    let startIdx = climbStartIdx;
    while (startIdx < endIdx - 1) {
      const d0 = points[startIdx].distanceKm;
      // Find the index closest to d0 + 1km
      let nextIdx = startIdx + 1;
      while (nextIdx < endIdx && points[nextIdx].distanceKm < d0 + 1.0) nextIdx++;
      if (nextIdx >= endIdx) break;
      const distM = (points[nextIdx].distanceKm - points[startIdx].distanceKm) * 1000;
      const elevDiff = smoothElev[nextIdx] - smoothElev[startIdx];
      const segGrad = distM > 1 ? (elevDiff / distM) * 100 : 0;
      if (segGrad >= TRIM_THRESHOLD) break;
      startIdx = nextIdx;
    }

    const gain = computeGain(smoothElev, startIdx, endIdx);
    const lengthKm = points[endIdx].distanceKm - points[startIdx].distanceKm;
    const avgGrad = lengthKm > 0 ? (gain / (lengthKm * 1000)) * 100 : 0;
    const cat = climbCategory(gain, avgGrad);
    if (cat !== null && gain >= MIN_GAIN_M) {
      climbs.push({
        startDistKm: parseFloat(points[startIdx].distanceKm.toFixed(1)),
        endDistKm: parseFloat(points[peakIdx].distanceKm.toFixed(1)),
        peakLat: points[peakIdx].lat,
        peakLng: points[peakIdx].lng,
        elevationGainM: Math.round(gain),
        avgGradientPct: parseFloat(avgGrad.toFixed(1)),
        maxGradientPct: parseFloat(maxGrad.toFixed(1)),
        lengthKm: parseFloat(lengthKm.toFixed(1)),
        category: cat,
      });
    }
  }

  for (let i = 0; i < smoothSeg.length; i++) {
    const g = smoothSeg[i];
    const nextElev = smoothElev[i + 1];

    if (state === 'idle') {
      if (g >= CLIMB_START) {
        state = 'climbing';
        climbStartIdx = i;
        peakIdx = i + 1;
        maxGrad = g;
      }
    } else if (state === 'climbing') {
      if (g > maxGrad) maxGrad = g;
      if (nextElev > smoothElev[peakIdx]) peakIdx = i + 1;
      if (g < CLIMB_END) {
        state = 'resting';
        restStartIdx = i;
      }
    } else {
      // resting
      const restKm = points[i + 1].distanceKm - points[restStartIdx].distanceKm;
      if (g >= CLIMB_START) {
        state = 'climbing';
        if (g > maxGrad) maxGrad = g;
        if (nextElev > smoothElev[peakIdx]) peakIdx = i + 1;
      } else if (restKm > MAX_REST_KM) {
        finishClimb(peakIdx);
        state = 'idle';
        if (g >= CLIMB_START) {
          state = 'climbing';
          climbStartIdx = i;
          peakIdx = i + 1;
          maxGrad = g;
        }
      }
    }
  }

  if (state === 'climbing' || state === 'resting') finishClimb(peakIdx);

  return climbs;
}

/** Smoothed gradient (%) at index i — averaged over ±4 surrounding segments to reduce GPS noise. */
export function smoothedSlopePct(points: ElevationPoint[], i: number): number {
  const half = 4;
  let sum = 0, count = 0;
  for (let j = Math.max(0, i - half); j < Math.min(points.length - 1, i + half + 1); j++) {
    const dDist = (points[j + 1].distanceKm - points[j].distanceKm) * 1000;
    const dElev = points[j + 1].elevationM - points[j].elevationM;
    sum += dDist > 1 ? (dElev / dDist) * 100 : 0;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function computeGain(smoothElev: number[], from: number, to: number): number {
  let gain = 0;
  for (let i = from; i < to; i++) {
    const d = smoothElev[i + 1] - smoothElev[i];
    if (d > 0) gain += d;
  }
  return gain;
}

/** Extracts the track as a list of [lat, lng] pairs for map rendering. */
export function extractGpxTrack(text: string, maxPoints = 1500): [number, number][] {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error("That doesn't look like a valid GPX file.");
  }

  const points = Array.from(doc.querySelectorAll('trkpt'));
  const coords: [number, number][] = [];
  for (const pt of points) {
    const lat = Number(pt.getAttribute('lat'));
    const lng = Number(pt.getAttribute('lon'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) coords.push([lat, lng]);
  }

  // Decimate evenly so the polyline stays light on mobile while keeping endpoints.
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out: [number, number][] = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  if (out[out.length - 1] !== coords[coords.length - 1]) out.push(coords[coords.length - 1]);
  return out;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
