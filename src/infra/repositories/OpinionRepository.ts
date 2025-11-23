import { supabaseDB } from "../../config/database";
import { Opinion } from "../../domain/entities/Opinion";
import { IOpinionRepository } from "../../domain/repositories/iOpinionRepository";

type OpinionRow = {
  id: string;
  usuario_id: string;
  establecimiento_id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
};

function toDomain(row: OpinionRow): Opinion {
  return new Opinion(
    row.id,
    row.usuario_id,
    row.establecimiento_id,
    Number(row.rating),
    row.comentario,
    new Date(row.created_at)
  );
}

export class OpinionesSupabaseRepository implements IOpinionRepository {
  async create(o: Opinion): Promise<Opinion> {
    const { data, error } = await supabaseDB
      .from("opiniones")
      .insert({
        id: o.id,
        usuario_id: o.usuario_id,
        establecimiento_id: o.establecimiento_id,
        rating: o.rating,
        comentario: o.comentario,
        created_at: o.created_at.toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as OpinionRow);
  }

  async findById(id: string): Promise<Opinion | null> {
    const { data, error } = await supabaseDB
      .from("opiniones")
      .select("*")
      .eq("id", id)
      .limit(1);
    if (error) throw error;
    const row = (data as OpinionRow[] | null)?.[0];
    if (!row) return null;
    return toDomain(row);
  }

  async findByUserAndEstablecimiento(
    usuarioId: string,
    establecimientoId: string
  ): Promise<Opinion | null> {
    const { data, error } = await supabaseDB
      .from("opiniones")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("establecimiento_id", establecimientoId)
      .limit(1);
    if (error) throw error;
    const row = (data as OpinionRow[] | null)?.[0];
    if (!row) return null;
    return toDomain(row);
  }

  async listByEstablecimiento(establecimientoId: string): Promise<Opinion[]> {
    const { data, error } = await supabaseDB
      .from("opiniones")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data as OpinionRow[]) || []).map(toDomain);
  }

  async listByUsuario(usuarioId: string, establecimientoId?: string): Promise<Opinion[]> {
    let query = supabaseDB.from("opiniones").select("*").eq("usuario_id", usuarioId);
    if (establecimientoId) query = query.eq("establecimiento_id", establecimientoId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return ((data as OpinionRow[]) || []).map(toDomain);
  }

  async update(id: string, partial: Partial<Opinion>): Promise<Opinion> {
    const payload: any = {};
    if (partial.rating !== undefined) payload.rating = partial.rating;
    if (partial.comentario !== undefined) payload.comentario = partial.comentario;

    const { data, error } = await supabaseDB
      .from("opiniones")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as OpinionRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB.from("opiniones").delete().eq("id", id);
    if (error) throw error;
  }
}
