import { supabaseDB } from "../../config/database";
import { Alerta } from "../../domain/entities/Alerta";
import {
  CreateAlertaInput,
  IAlertaRepository,
} from "../../domain/repositories/IAlertaRepository";

type AlertaRow = {
  id: string;
  establecimiento_id: string;
  slot_id: string;
  reporter_user_id: string;
  mensaje: string | null;
  estado: string;
  created_at: string;
  viewed_at: string | null;
};

const toDomain = (row: AlertaRow): Alerta =>
  new Alerta(
    row.id,
    row.establecimiento_id,
    row.slot_id,
    row.reporter_user_id,
    row.mensaje,
    row.estado,
    new Date(row.created_at),
    row.viewed_at ? new Date(row.viewed_at) : null
  );

export class AlertasRepository implements IAlertaRepository {
  async create(input: CreateAlertaInput): Promise<Alerta> {
    const { data, error } = await supabaseDB
      .from("alertas")
      .insert({
        establecimiento_id: input.establecimiento_id,
        slot_id: input.slot_id,
        reporter_user_id: input.reporter_user_id,
        mensaje: input.mensaje ?? null,
        estado: input.estado ?? "pendiente",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as AlertaRow);
  }

  async findById(id: string): Promise<Alerta | null> {
    const { data, error } = await supabaseDB
      .from("alertas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return toDomain(data as AlertaRow);
  }

  async listByEstablecimiento(
    establecimientoId: string,
    opts?: { estado?: string | null; limit?: number }
  ): Promise<Alerta[]> {
    let query = supabaseDB
      .from("alertas")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("created_at", { ascending: false });
    if (opts?.estado) query = query.eq("estado", opts.estado);
    if (opts?.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw error;
    return ((data as AlertaRow[]) ?? []).map(toDomain);
  }

  async markRead(id: string, at: Date = new Date()): Promise<Alerta> {
    const { data, error } = await supabaseDB
      .from("alertas")
      .update({ viewed_at: at.toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as AlertaRow);
  }

  async updateEstado(id: string, estado: string): Promise<Alerta> {
    const { data, error } = await supabaseDB
      .from("alertas")
      .update({ estado })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as AlertaRow);
  }
}
