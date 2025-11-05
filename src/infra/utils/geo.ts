import type { GeoPolygon, LatLng } from "../../domain/types/coordsType";

const POINT_REGEX = /POINT\s*\(\s*([-0-9.+eE]+)\s+([-0-9.+eE]+)\s*\)/i;
const POLYGON_REGEX = /POLYGON\s*\(\(\s*([^)]+?)\s*\)\)/i;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const parseLatLng = (value: any): LatLng | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(POINT_REGEX);
    if (match) {
      const lng = toNumber(match[1]);
      const lat = toNumber(match[2]);
      if (lat != null && lng != null) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    const lng = toNumber(value[0]);
    const lat = toNumber(value[1]);
    if (lat != null && lng != null) return { latitude: lat, longitude: lng };
  }

  if (typeof value === "object") {
    if (
      Object.prototype.hasOwnProperty.call(value, "latitude") &&
      Object.prototype.hasOwnProperty.call(value, "longitude")
    ) {
      const lat = toNumber((value as any).latitude);
      const lng = toNumber((value as any).longitude);
      if (lat != null && lng != null) return { latitude: lat, longitude: lng };
    }
    if (
      Object.prototype.hasOwnProperty.call(value, "lat") &&
      Object.prototype.hasOwnProperty.call(value, "lng")
    ) {
      const lat = toNumber((value as any).lat);
      const lng = toNumber((value as any).lng);
      if (lat != null && lng != null) return { latitude: lat, longitude: lng };
    }
    if (Array.isArray((value as any)?.coordinates)) {
      return parseLatLng((value as any).coordinates);
    }
  }

  return null;
};

const normalizePolygon = (points: LatLng[]): GeoPolygon => {
  if (!points.length) return null;
  const [first] = points;
  const last = points[points.length - 1];
  if (
    first &&
    last &&
    first.latitude === last.latitude &&
    first.longitude === last.longitude
  ) {
    points = points.slice(0, -1);
  }
  return points.length >= 3 ? points : null;
};

export const parsePolygon = (value: any): GeoPolygon => {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(POLYGON_REGEX);
    if (match) {
      const pairs = match[1]
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      const points: LatLng[] = [];
      for (const pair of pairs) {
        const [lngStr, latStr] = pair.split(/\s+/);
        const lng = toNumber(lngStr);
        const lat = toNumber(latStr);
        if (lat != null && lng != null) {
          points.push({ latitude: lat, longitude: lng });
        }
      }
      return normalizePolygon(points);
    }
  }

  if (Array.isArray(value)) {
    const points: LatLng[] = [];
    for (const item of value) {
      if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
        const nested = parsePolygon(item);
        if (nested) return nested;
      } else {
        const point = parseLatLng(item);
        if (point) points.push(point);
      }
    }
    return normalizePolygon(points);
  }

  if (typeof value === "object") {
    if (Array.isArray((value as any)?.coordinates)) {
      return parsePolygon((value as any).coordinates);
    }
    if (Array.isArray((value as any)?.points)) {
      return parsePolygon((value as any).points);
    }
  }

  return null;
};
