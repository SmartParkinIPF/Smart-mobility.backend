import { supabaseDB } from "../../config/database";
import { Establecimiento } from "../../domain/entities/Establecimiento";
import { IEstablecimientoRepository } from "../../domain/repositories/IEstablecimientoRepository";
import type { LatLng } from "../../domain/types/coordsType";

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
  // location almacenado como geography(Point). No podemos leerlo directo; lo devolvemos como null para lectura rápida
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
    [],
    // lecturas de geography requieren funciones; aquí lo dejamos vacío para no romper typing
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
  async create(est: Establecimiento): Promise<Establecimiento> {
    // Construir WKT POLYGON a partir de la lista de puntos
    const points = est.perimetro ?? [];
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
    // WKT para el punto de localización (lon lat)
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
        perimetro: polygonWkt,
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
    return toDomain(r);
  }

  async list(): Promise<Establecimiento[]> {
    const { data, error } = await supabaseDB
      .from("establecimientos")
      .select("*");
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
        first.latitude === last.latitude &&
        first.longitude === last.longitude
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
