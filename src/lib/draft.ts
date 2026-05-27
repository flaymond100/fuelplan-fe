// Rough aerodynamic drafting estimate for cycling.
// Whole-route average bearing vs. wind → average headwind component →
// watts saved by sitting in a group (≈30% less air drag).

const AIR_DENSITY = 1.225; // kg/m³ at ~15°C, sea level
const CDA_SOLO = 0.32; // m² — road bike on the hoods, typical recreational rider
const DRAFT_CDA_REDUCTION = 0.3; // ≈30% less drag sitting in a bunch

export type WindRelation = 'headwind' | 'tailwind' | 'crosswind';

export interface DraftEstimate {
  relation: WindRelation;
  headwindKmh: number; // signed: + into the wind, − pushed along
  wattsSaved: number; // drafting saving at race pace, in this wind
  speedKmh: number;
}

/** Initial great-circle bearing from A to B, in degrees [0,360). */
export function bearingDeg(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

function relationFor(angleDiff: number): WindRelation {
  const a = Math.abs(((angleDiff % 360) + 540) % 360 - 180); // 0 = headwind, 180 = tailwind
  if (a < 45) return 'headwind';
  if (a > 135) return 'tailwind';
  return 'crosswind';
}

/**
 * @param windFromDeg  bearing the wind blows FROM (open-meteo convention)
 * @param windSpeedKmh max wind speed
 * @param routeBearingDeg dominant start→finish bearing of the route
 * @param speedKmh     rider ground speed (distance / estimated duration)
 */
export function estimateDraft(
  windFromDeg: number,
  windSpeedKmh: number,
  routeBearingDeg: number,
  speedKmh: number,
): DraftEstimate {
  // Wind coming FROM the travel bearing is a pure headwind → cos(0) = 1.
  const headwindKmh = windSpeedKmh * Math.cos(((windFromDeg - routeBearingDeg) * Math.PI) / 180);

  const vGround = speedKmh / 3.6; // m/s
  const vAir = Math.max(vGround + headwindKmh / 3.6, 0); // air speed felt by the rider

  // Power saved = ½·ρ·ΔCdA·v_air²·v_ground
  const wattsSaved = 0.5 * AIR_DENSITY * (DRAFT_CDA_REDUCTION * CDA_SOLO) * vAir * vAir * vGround;

  return {
    relation: relationFor(windFromDeg - routeBearingDeg),
    headwindKmh,
    wattsSaved: Math.round(wattsSaved),
    speedKmh,
  };
}
