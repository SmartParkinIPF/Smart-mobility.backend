export type LatLng = { latitude: number; longitude: number };
export type GeoPolygon = LatLng[] | null; // 4+ points validated at schema level
