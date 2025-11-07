import { supabaseDB } from "../../config/database";
import { IPoliticaCancelacionRepository } from "../../domain/repositories/iPoliticaCancelacionRepository";
import { PoliticaCancelacion } from "../../domain/entities/PoliticaCancelacion";

type PoliticaRow = {
  id: string;
  descripcion_corta: string | null;
  reglas_json: unknown;
  created_at: string;
  updated_at: string;
};

function toDomain(r: PoliticaRow): PoliticaCancelacion {
  return new PoliticaCancelacion(
    r.id,
    r.descripcion_corta,
    r.reglas_json,
    new Date(r.created_at),
    new Date(r.updated_at)
  );
}

export class PoliticasCancelacionSupabaseRepository implements IPoliticaCancelacionRepository {
  async create(p: PoliticaCancelacion): Promise<PoliticaCancelacion> {
    const { data, error } = await supabaseDB
      .from("politicas_cancelacion")
      .insert({
        id: p.id,
        descripcion_corta: p.descripcion_corta,
        reglas_json: p.reglas_json,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as PoliticaRow);
  }

  async findById(id: string): Promise<PoliticaCancelacion> {
    const { data, error } = await supabaseDB
      .from("politicas_cancelacion")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return toDomain(data as PoliticaRow);
  }

  async list(): Promise<PoliticaCancelacion[]> {
    const { data, error } = await supabaseDB
      .from("politicas_cancelacion")
      .select("*");
    if (error) throw error;
    return (data as PoliticaRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<PoliticaCancelacion>): Promise<PoliticaCancelacion> {
    const payload: any = {};
    if (partial.descripcion_corta !== undefined)
      payload.descripcion_corta = partial.descripcion_corta;
    if (partial.reglas_json !== undefined) payload.reglas_json = partial.reglas_json;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("politicas_cancelacion")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as PoliticaRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB
      .from("politicas_cancelacion")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

