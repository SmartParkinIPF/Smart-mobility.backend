import { supabaseDB } from "../../config/database";
import { Slots } from "../../domain/entities/Slots";
import { ISlotsRepository } from "../../domain/repositories/ISlotsRepository";

type SlotRow = {
  id: string;
  estacionamiento_id: string;
  codigo: string;
  tipo: string;
  ancho_cm: number;
  largo_cm: number;
  ubicacion_local: unknown; // jsonb
  estado_operativo: string;
  tarifa_id: string;
  es_reservable: boolean;
  created_at: string;
  updated_at: string;
};

function toDomain(r: SlotRow): Slots {
  return new Slots(
    r.id,
    r.estacionamiento_id,
    r.codigo,
    r.tipo,
    r.ancho_cm,
    r.largo_cm,
    (r.ubicacion_local as any) ?? [],
    r.estado_operativo,
    r.tarifa_id,
    r.es_reservable,
    new Date(r.created_at),
    new Date(r.updated_at)
  );
}

export class SlotsSupabaseRepository implements ISlotsRepository {
  async create(slot: Slots): Promise<Slots> {
    const { data, error } = await supabaseDB
      .from("slots")
      .insert({
        id: slot.id,
        estacionamiento_id: slot.estacionamiento_id,
        codigo: slot.codigo,
        tipo: slot.tipo,
        ancho_cm: slot.ancho_cm,
        largo_cm: slot.largo_cm,
        ubicacion_local: slot.ubicacion_local,
        estado_operativo: slot.estado_operativo,
        tarifa_id: slot.tarifa_id,
        es_reservable: slot.es_reservable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as SlotRow);
  }

  async findById(id: string): Promise<Slots | null> {
    const { data, error } = await supabaseDB
      .from("slots")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if ((error as any)?.code === "PGRST116") return null;
      throw error;
    }
    return toDomain(data as SlotRow);
  }

  async list(): Promise<Slots[]> {
    const { data, error } = await supabaseDB.from("slots").select("*");
    if (error) throw error;
    return (data as SlotRow[]).map(toDomain);
  }

  async listByEstacionamiento(estacionamientoId: string): Promise<Slots[]> {
    const { data, error } = await supabaseDB
      .from("slots")
      .select("*")
      .eq("estacionamiento_id", estacionamientoId);
    if (error) throw error;
    return (data as SlotRow[]).map(toDomain);
  }

  async listByEstablecimiento(establecimientoId: string): Promise<Slots[]> {
    // Paso 1: obtener los estacionamientos del establecimiento
    const { data: estacionamientos, error: estError } = await supabaseDB
      .from("estacionamientos")
      .select("id")
      .eq("establecimiento_id", establecimientoId);
    if (estError) throw estError;
    const ids = (estacionamientos ?? [])
      .map((e: any) => e.id)
      .filter(Boolean);
    if (!ids.length) return [];
console.log("ides",estacionamientos)
    // Paso 2: traer slots cuyo estacionamiento_id esté en los IDs obtenidos
    const { data, error } = await supabaseDB
      .from("slots")
      .select(
        "id, estacionamiento_id, codigo, tipo, ancho_cm, largo_cm, ubicacion_local, estado_operativo, tarifa_id, es_reservable, created_at, updated_at"
      )
      .in("estacionamiento_id", ids);
    if (error) throw error;

    return (data as SlotRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<Slots>): Promise<Slots> {
    const payload: any = {};
    if (partial.codigo !== undefined) payload.codigo = partial.codigo;
    if (partial.tipo !== undefined) payload.tipo = partial.tipo;
    if (partial.ancho_cm !== undefined) payload.ancho_cm = partial.ancho_cm;
    if (partial.largo_cm !== undefined) payload.largo_cm = partial.largo_cm;
    if (partial.ubicacion_local !== undefined)
      payload.ubicacion_local = partial.ubicacion_local;
    if (partial.estado_operativo !== undefined)
      payload.estado_operativo = partial.estado_operativo;
    if (partial.tarifa_id !== undefined) payload.tarifa_id = partial.tarifa_id;
    if (partial.es_reservable !== undefined)
      payload.es_reservable = partial.es_reservable;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("slots")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as SlotRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB.from("slots").delete().eq("id", id);
    if (error) throw error;
  }
}
