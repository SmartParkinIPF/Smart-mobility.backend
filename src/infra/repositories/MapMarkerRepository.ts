import { IMapMarkerRepository } from "../../domain/repositories/IMarkerRepository";
import { MapMarker, Coordinate } from "../../domain/entities/MapMarker";
import { supabaseDB } from "../../config/database";

type MarkerRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  pin_color: string;
  created_at: string;
};

type CoordRow = {
  marker_id: string;
  latitude: number;
  longitude: number;
};

function toDomain(marker: MarkerRow, coords: CoordRow[]): MapMarker {
  const coordinates: Coordinate[] = coords.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  }));
  return new MapMarker(
    marker.id,
    marker.title,
    marker.description,
    marker.category,
    coordinates,
    marker.pin_color,
    new Date(marker.created_at)
  );
}

export class MapMarkerSupabaseRepository implements IMapMarkerRepository {
  async create(marker: MapMarker): Promise<MapMarker> {
    // 1) Insert marker
    const { data: markerData, error: markerErr } = await supabaseDB
      .from("map_markers")
      .insert({
        id: marker.id,
        title: marker.title,
        description: marker.description,
        category: marker.category,
        pin_color: marker.pinColor,
        created_at: marker.createdAt.toISOString(),
      })
      .select()
      .single();
    if (markerErr) throw markerErr;

    // 2) Insert coordinates (bulk)
    const coordPayload = marker.coordinates.map((c) => ({
      marker_id: marker.id,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    if (coordPayload.length) {
      const { error: coordsErr } = await supabaseDB
        .from("marker_coordinates")
        .insert(coordPayload);
      if (coordsErr) throw coordsErr;
    }

    return toDomain(markerData as MarkerRow, coordPayload as CoordRow[]);
  }

  async findAll(): Promise<MapMarker[]> {
    // Traer todos los markers
    const { data: markers, error: mErr } = await supabaseDB
      .from("map_markers")
      .select("*")
      .order("created_at", { ascending: false });

    if (mErr) throw mErr;
    if (!markers?.length) return [];

    // Traer todas las coords de una sola vez por ids
    const ids = (markers as MarkerRow[]).map((m) => m.id);
    const { data: coords, error: cErr } = await supabaseDB
      .from("marker_coordinates")
      .select("*")
      .in("marker_id", ids);

    if (cErr) throw cErr;

    const mapCoords = new Map<string, CoordRow[]>();
    (coords as CoordRow[] | null)?.forEach((c) => {
      const arr = mapCoords.get(c.marker_id) || [];
      arr.push(c);
      mapCoords.set(c.marker_id, arr);
    });

    return (markers as MarkerRow[]).map((m) =>
      toDomain(m, mapCoords.get(m.id) || [])
    );
  }

  async existsByLatLon(latitude: number, longitude: number): Promise<boolean> {
    const { data, error } = await supabaseDB
      .from("marker_coordinates")
      .select("marker_id")
      .eq("latitude", latitude)
      .eq("longitude", longitude)
      .limit(1);
    if (error) throw error;
    return !!data && data.length > 0;
  }
}
