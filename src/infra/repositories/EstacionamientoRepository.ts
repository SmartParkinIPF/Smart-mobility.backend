import { supabaseDB } from "../../config/database";
import { Estacionamiento } from "../../domain/entities/Estacionamiento";
import { IEstacionamientoRepository } from "../../domain/repositories/iEstacionamientoRepository";
import type { LatLng } from "../../domain/types/coordsType";

type ParkRow = {
  id: string;
  establecimiento_id: string;
  nombre: string;
  tipo: string;
  soporta_discapacidad: boolean;
  soporta_motos: boolean;
  soporta_electricos: boolean;
  tiene_cargadores: boolean;
  cantidad_cargadores: number;
  tarifa_id: string;
  horario_id: string;
  politica_cancelacion_id: string;
  estado: string;
  ubicacion: LatLng;
  perimetro_est: unknown;
  created_at: string;
  updated_at: string;
};

function toDomain(p: ParkRow): Estacionamiento {
  // Parse possible perimetro formats (WKT POLYGON, GeoJSON, array)
  const parsePerimetro = (
    raw: any
  ): { latitude: number; longitude: number }[] | null => {
    if (!raw) return null;
    if (typeof raw === "string") {
      const polyMatch = raw.match(/POLYGON\s*\(\s*\(\s*([^\)]+)\s*\)\s*\)/i);
      if (polyMatch) {
        const pairs = polyMatch[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const pts: { latitude: number; longitude: number }[] = [];
        for (const pair of pairs) {
          const [lngStr, latStr] = pair.split(/\s+/);
          const lng = Number(lngStr);
          const lat = Number(latStr);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          pts.push({ latitude: lat, longitude: lng });
        }
        return pts.length >= 3 ? pts : null;
      }
      return null;
    }
    if (typeof raw === "object") {
      if (raw.type && Array.isArray(raw.coordinates)) {
        const type = String(raw.type).toLowerCase();
        if (type === "polygon" || type === "multipolygon") {
          const coords =
            type === "polygon"
              ? raw.coordinates[0] ?? raw.coordinates
              : raw.coordinates[0]?.[0] ?? raw.coordinates[0] ?? [];
          if (Array.isArray(coords)) {
            const pts = coords
              .map((c: any) => {
                const [lng, lat] = c;
                const latN = Number(lat);
                const lngN = Number(lng);
                if (!Number.isFinite(latN) || !Number.isFinite(lngN))
                  return null;
                return { latitude: latN, longitude: lngN };
              })
              .filter(Boolean);
            return pts.length >= 3 ? (pts as any) : null;
          }
        }
      }
      if (Array.isArray(raw) && raw.length >= 3) {
        const pts = raw
          .map((it: any) => {
            const lat = Number(it?.latitude ?? it?.lat ?? it?.y ?? it?.[1]);
            const lng = Number(it?.longitude ?? it?.lng ?? it?.x ?? it?.[0]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { latitude: lat, longitude: lng };
          })
          .filter(Boolean);
        return pts.length >= 3 ? (pts as any) : null;
      }
    }
    return null;
  };

  const parsed = parsePerimetro((p as any).perimetro_est ?? null);

  return new Estacionamiento(
    p.id,
    p.establecimiento_id,
    p.nombre,
    p.tipo,
    p.soporta_discapacidad,
    p.soporta_motos,
    p.soporta_electricos,
    p.tiene_cargadores,
    p.cantidad_cargadores,
    p.tarifa_id,
    p.horario_id,
    p.politica_cancelacion_id,
    p.estado,
    p.ubicacion,
    parsed ?? null,
    new Date(p.created_at),
    new Date(p.updated_at)
  );
}

export class EstacionamientoSupabaseRepository
  implements IEstacionamientoRepository
{
  async create(park: Estacionamiento): Promise<Estacionamiento> {
    const points = park.perimetro_est ?? [];
    if (points.length < 4) {
      throw new Error("El perímetro debe tener al menos 4 puntos");
    }
    const first = points[0];
    const last = points[points.length - 1];

    const closed =
      first.latitude === last.latitude && first.longitude === last.longitude
        ? points
        : [...points, first];

    const coords = closed.map((p) => `${p.longitude} ${p.latitude}`).join(", ");
    const polygonWkt = `POLYGON((${coords}))`;

    const pointWkt = `POINT(${park.ubicacion.longitude} ${park.ubicacion.latitude})`;

    const { data, error } = await supabaseDB
      .from("estacionamientos")
      .insert({
        id: park.id,
        establecimiento_id: park.establecimiento_id,
        nombre: park.nombre,
        tipo: park.tipo,
        soporta_discapacidad: park.soporta_discapacidad,
        soporta_motos: park.soporta_motos,
        soporta_electricos: park.soporta_electricos,
        tiene_cargadores: park.tiene_cargadores,
        cantidad_cargadores: park.cantidad_cargadores,
        tarifa_id: park.tarifa_id,
        horario_id: park.horario_id,
        politica_cancelacion_id: park.politica_cancelacion_id,
        estado: park.estado,
        ubicacion: pointWkt,
        perimetro_est: polygonWkt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    const p = data as ParkRow;
    return toDomain({ ...p, ubicacion: park.ubicacion });
  }

  async findById(id: string): Promise<Estacionamiento | null> {
    const { data, error } = await supabaseDB
      .from("estacionamientos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if ((error as any)?.code === "PGRST116") return null;
      throw error;
    }
    const p = data as ParkRow;
    return toDomain(p);
  }

  async list(): Promise<Estacionamiento[]> {
    const { data, error } = await supabaseDB
      .from("estacionamientos")
      .select("*");
    if (error) throw error;
    return (data as ParkRow[]).map(toDomain);
  }

  async listPaged({
    q = "",
    page = 1,
    limit = 20,
  }: {
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabaseDB
      .from("estacionamientos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (q) {
      const pattern = `%${q}%`;
      query = query.ilike("nombre", pattern);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data as ParkRow[]).map(toDomain);
    return { items, total: count ?? items.length };
  }

  async listByEstablecimiento(
    establecimientoId: string
  ): Promise<Estacionamiento[]> {
    const { data, error } = await supabaseDB
      .from("estacionamientos")
      .select("*")
      .eq("establecimiento_id", establecimientoId);
    if (error) throw error;
    return (data as ParkRow[]).map(toDomain);
  }

  async update(
    id: string,
    partial: Partial<Estacionamiento>
  ): Promise<Estacionamiento> {
    const payload: any = {};
    if (partial.nombre !== undefined) payload.nombre = partial.nombre;
    if (partial.tipo !== undefined) payload.tipo = partial.tipo;
    if (partial.soporta_discapacidad !== undefined)
      payload.soporta_discapacidad = partial.soporta_discapacidad;
    if (partial.soporta_motos !== undefined)
      payload.soporta_motos = partial.soporta_motos;
    if (partial.soporta_electricos !== undefined)
      payload.soporta_electricos = partial.soporta_electricos;
    if (partial.tiene_cargadores !== undefined)
      payload.tiene_cargadores = partial.tiene_cargadores;
    if (partial.cantidad_cargadores !== undefined)
      payload.cantidad_cargadores = partial.cantidad_cargadores;
    if (partial.tarifa_id !== undefined) payload.tarifa_id = partial.tarifa_id;
    if (partial.horario_id !== undefined)
      payload.horario_id = partial.horario_id;
    if (partial.politica_cancelacion_id !== undefined)
      payload.politica_cancelacion_id = partial.politica_cancelacion_id;
    if (partial.estado !== undefined) payload.estado = partial.estado;
    if (partial.ubicacion)
      payload.ubicacion = `POINT(${partial.ubicacion.longitude} ${partial.ubicacion.latitude})`;
    if (partial.perimetro_est && partial.perimetro_est.length >= 4) {
      const pts = partial.perimetro_est;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const closed =
        first.latitude === last.latitude && first.longitude === last.longitude
          ? pts
          : [...pts, first];
      const coords = closed
        .map((p) => `${p.longitude} ${p.latitude}`)
        .join(", ");
      payload.perimetro_est = `POLYGON((${coords}))`;
    }
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("estacionamientos")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const p = data as ParkRow;
    return toDomain({ ...p } as ParkRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB
      .from("estacionamientos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
