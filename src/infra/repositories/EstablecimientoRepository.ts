import { supabaseDB } from "../../config/database";
import { Establecimiento } from "../../domain/entities/Establecimiento";
import { IEstablecimientoRepository } from "../../domain/repositories/IEstablecimientoRepository";
import type { LatLng } from "../../domain/types/coordsType";
import * as wkx from "wkx";

type EstRow = {
  id: string;
  propietario_id: string;
  nombre: string;
  descripcion: string;
  direccion_calle: string;
  direccion_numero: string;
  ciudad: string;
  provincia: string;
  pais: string;
  cp: string;
  perimetro: unknown;
  localizacion: LatLng;
  estado: string;
  horario_general: unknown;
  capacidad_teorica: number;
  created_at: string;
  updated_at: string;
};

function toDomain(r: EstRow): Establecimiento {
  // Intentamos parsear la columna `perimetro` en distintos formatos (WKT POLYGON, GeoJSON, array de puntos)
  const parsePerimetro = (
    raw: any
  ): { latitude: number; longitude: number }[] | null => {
    if (!raw) return null;
    // Si viene como string WKT POLYGON: POLYGON((lng lat, lng lat, ...))
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

      // Postgres/PostGIS may return geometry as WKB hex (EWKB) string like "01030000..." or "\\x01030000..."
      // Intentamos parsear hex WKB usando 'wkx' si se detecta un patrón hex.
      const hexRaw = raw.startsWith("\\x")
        ? raw.slice(2)
        : raw.startsWith("0x")
        ? raw.slice(2)
        : raw;
      if (/^[0-9a-fA-F]+$/.test(hexRaw) && hexRaw.length >= 16) {
        try {
          const buf = Buffer.from(hexRaw, "hex");
          const geom = wkx.Geometry.parse(buf);
          const gj = geom.toGeoJSON();
          if (
            gj &&
            ((gj as any).type === "Polygon" ||
              (gj as any).type === "MultiPolygon")
          ) {
            const coords =
              (gj as any).type === "Polygon"
                ? (gj as any).coordinates[0]
                : (gj as any).coordinates[0]?.[0] ?? (gj as any).coordinates[0];
            if (Array.isArray(coords)) {
              const pts = coords
                .map((c: any) => ({
                  latitude: Number(c[1]),
                  longitude: Number(c[0]),
                }))
                .filter(
                  (p: any) =>
                    Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
                );
              return pts.length >= 3 ? pts : null;
            }
          }
        } catch (e) {
          // ignore parse errors and fallback to null
        }
      }

      // Si es POINT(...) u otro, no lo consideramos perímetro
      return null;
    }

    // Si viene como GeoJSON-like
    if (typeof raw === "object") {
      // Feature/GeoJSON Polygon
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

      // Si ya viene como array de puntos [{latitude,longitude}, ...]
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

  const parsedPerimeter = parsePerimetro(
    (r as any).perimetro ??
      (r as any).perimetro_est ??
      (r as any).perimeter ??
      null
  );

  return new Establecimiento(
    r.id,
    r.propietario_id,
    r.nombre,
    r.descripcion,
    r.direccion_calle,
    r.direccion_numero,
    r.ciudad,
    r.provincia,
    r.pais,
    r.cp,
    parsedPerimeter ?? null,
    // lecturas de geography requieren funciones; devolvemos lo que haya en la columna
    r.localizacion,
    r.estado,
    r.horario_general,
    r.capacidad_teorica,
    new Date(r.created_at),
    new Date(r.updated_at)
  );
}

export class EstablecimientoSupabaseRepository
  implements IEstablecimientoRepository
{
  async listWithParkings(): Promise<
    { est: Establecimiento; parkings: { id: string; tipo: string | null }[] }[]
  > {
    const { data, error } = await supabaseDB
      .from("establecimientos")
      .select("*, estacionamientos:estacionamientos(id, tipo)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as any[]).map((row) => ({
      est: toDomain(row as any),
      parkings: Array.isArray((row as any)?.estacionamientos)
        ? (row as any).estacionamientos.map((p: any) => ({
            id: p.id,
            tipo: p.tipo ?? null,
          }))
        : [],
    }));
  }

  async create(est: Establecimiento): Promise<Establecimiento> {
    const pointWkt = `POINT(${est.localizacion.longitude} ${est.localizacion.latitude})`;

    const { data, error } = await supabaseDB
      .from("establecimientos")
      .insert({
        id: est.id,
        propietario_id: est.propietario_id,
        nombre: est.nombre,
        descripcion: est.descripcion,
        direccion_calle: est.direccion_calle,
        direccion_numero: est.direccion_numero,
        ciudad: est.ciudad,
        provincia: est.provincia,
        pais: est.pais,
        cp: est.cp,
        perimetro: null,
        localizacion: pointWkt,
        estado: est.estado,
        horario_general: est.horario_general,
        capacidad_teorica: est.capacidad_teorica,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    const r = data as any;
    // Devolvemos el polígono original (PostgREST no deserializa geography)
    return new Establecimiento(
      r.id,
      r.propietario_id,
      r.nombre,
      r.descripcion,
      r.direccion_calle,
      r.direccion_numero,
      r.ciudad,
      r.provincia,
      r.pais,
      r.cp,
      est.perimetro,
      est.localizacion,
      r.estado,
      r.horario_general,
      r.capacidad_teorica,
      new Date(r.created_at),
      new Date(r.updated_at)
    );
  }

  async findById(id: string): Promise<Establecimiento | null> {
    const { data, error } = await supabaseDB
      .from("establecimientos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if ((error as any)?.code === "PGRST116") return null; // not found
      throw error;
    }
    const r = data as any;
    console.log(toDomain(r));
    return toDomain(r);
  }

  async list(): Promise<Establecimiento[]> {
    const { data, error } = await supabaseDB
      .from("establecimientos")
      .select("*");
    if (error) throw error;
    return (data as any[]).map((r) => toDomain(r as any));
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
      .from("establecimientos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (q) {
      const pattern = `%${q}%`;
      query = query.ilike("nombre", pattern);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data as any[]).map((r) => toDomain(r as any));
    return { items, total: count ?? items.length };
  }

  async listByOwner(ownerId: string): Promise<Establecimiento[]> {
    const { data, error } = await supabaseDB
      .from("establecimientos")
      .select("*")
      .eq("propietario_id", ownerId);
    if (error) throw error;
    return (data as any[]).map((r) => toDomain(r as any));
  }

  async update(
    id: string,
    partial: Partial<Establecimiento>
  ): Promise<Establecimiento> {
    const payload: any = {};
    if (partial.nombre !== undefined) payload.nombre = partial.nombre;
    if (partial.descripcion !== undefined)
      payload.descripcion = partial.descripcion;
    if (partial.direccion_calle !== undefined)
      payload.direccion_calle = partial.direccion_calle;
    if (partial.direccion_numero !== undefined)
      payload.direccion_numero = partial.direccion_numero;
    if (partial.ciudad !== undefined) payload.ciudad = partial.ciudad;
    if (partial.provincia !== undefined) payload.provincia = partial.provincia;
    if (partial.pais !== undefined) payload.pais = partial.pais;
    if (partial.cp !== undefined) payload.cp = partial.cp;
    if (partial.estado !== undefined) payload.estado = partial.estado;
    if (partial.horario_general !== undefined)
      payload.horario_general = partial.horario_general;
    if (partial.capacidad_teorica !== undefined)
      payload.capacidad_teorica = partial.capacidad_teorica;

    if (partial.localizacion) {
      payload.localizacion = `POINT(${partial.localizacion.longitude} ${partial.localizacion.latitude})`;
    }
    if (partial.perimetro && partial.perimetro.length >= 4) {
      const pts = partial.perimetro;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const closed =
        first.latitude === last.latitude && first.longitude === last.longitude
          ? pts
          : [...pts, first];
      const coords = closed
        .map((p) => `${p.longitude} ${p.latitude}`)
        .join(", ");
      payload.perimetro = `POLYGON((${coords}))`;
    }
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("establecimientos")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const r = data as any;
    // devolver con geometrías de entrada si fueron enviadas
    return new Establecimiento(
      r.id,
      r.propietario_id,
      r.nombre,
      r.descripcion,
      r.direccion_calle,
      r.direccion_numero,
      r.ciudad,
      r.provincia,
      r.pais,
      r.cp,
      partial.perimetro ?? [],
      (partial as any).localizacion ?? r.localizacion,
      r.estado,
      r.horario_general,
      r.capacidad_teorica,
      new Date(r.created_at),
      new Date(r.updated_at)
    );
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB
      .from("establecimientos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
