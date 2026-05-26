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
