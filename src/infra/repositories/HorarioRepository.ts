import { supabaseDB } from "../../config/database";
import { IHorarioRepository } from "../../domain/repositories/iHorarioRepository";
import { Horario } from "../../domain/entities/horario";

type HorarioRow = {
  id: string;
  id_usuario: string;
  tipo: string;
  definicion: string;
  created_at: string;
  updated_at: string;
};

function toDomain(h: HorarioRow): Horario {
  return new Horario(
    h.id,
    h.id_usuario,
    h.tipo,
    h.definicion,
    new Date(h.created_at),
    new Date(h.updated_at)
  );
}

export class HorariosSupabaseRepository implements IHorarioRepository {
  async created(hor: Horario): Promise<Horario> {
    const { data, error } = await supabaseDB
      .from("horarios")
      .insert({
        id: hor.id,
        id_usuario: hor.id_usuario,
        tipo: hor.tipo,
        definicion: hor.definicion,
        created_at: hor.created_at,
        updated_at: hor.updated_at,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data as HorarioRow);
  }

  async findById(id: string): Promise<Horario> {
    const { data, error } = await supabaseDB
      .from("horarios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return toDomain(data as HorarioRow);
  }

  async list(): Promise<Horario[]> {
    const { data, error } = await supabaseDB.from("horarios").select("*");

    if (error) throw error;
    return (data as HorarioRow[]).map(toDomain);
  }

  async listByUser(userId: string): Promise<Horario[]> {
    const { data, error } = await supabaseDB
      .from("horarios")
      .select("*")
      .eq("id_usuario", userId);
    if (error) throw error;
    return (data as HorarioRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<Horario>): Promise<Horario> {
    const payload: any = {};

    if (partial.tipo !== undefined) payload.tipo = partial.tipo;
    if (partial.definicion !== undefined) payload.definicion = partial.definicion;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("horarios")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data as HorarioRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB.from("horarios").delete().eq("id", id);
    if (error) throw error;
  }
}
