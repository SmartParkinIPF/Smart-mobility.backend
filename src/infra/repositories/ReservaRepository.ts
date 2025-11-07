import { supabaseDB } from "../../config/database";
import { IReservaRepository } from "../../domain/repositories/iReservaRepository";
import { Reserva } from "../../domain/entities/Reserva";

type ReservaRow = {
  id: string;
  usuario_id: string;
  slot_id: string | null;
  desde: string; // ISO
  hasta: string; // ISO
  estado: string;
  precio_total: number | null;
  moneda: string; // char(3)
  origen: string;
  codigo_qr: string | null;
  created_at: string;
  updated_at: string;
};

function toDomain(r: ReservaRow): Reserva {
  return new Reserva(
    r.id,
    r.usuario_id,
    r.slot_id,
    new Date(r.desde),
    new Date(r.hasta),
    r.estado,
    r.precio_total === null ? null : Number(r.precio_total),
    r.moneda,
    r.origen,
    r.codigo_qr,
    new Date(r.created_at),
    new Date(r.updated_at)
  );
}

export class ReservasSupabaseRepository implements IReservaRepository {
  async create(r: Reserva): Promise<Reserva> {
    const { data, error } = await supabaseDB
      .from("reservas")
      .insert({
        id: r.id,
        usuario_id: r.usuario_id,
        slot_id: r.slot_id,
        desde: r.desde.toISOString(),
        hasta: r.hasta.toISOString(),
        estado: r.estado,
        precio_total: r.precio_total,
        moneda: r.moneda,
        origen: r.origen,
        codigo_qr: r.codigo_qr,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data as ReservaRow);
  }

  async findById(id: string): Promise<Reserva> {
    const { data, error } = await supabaseDB
      .from("reservas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return toDomain(data as ReservaRow);
  }

  async listByUsuario(usuarioId: string, estado?: string): Promise<Reserva[]> {
    let query = supabaseDB.from("reservas").select("*").eq("usuario_id", usuarioId);
    if (estado) query = query.eq("estado", estado);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ReservaRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<Reserva>): Promise<Reserva> {
    const payload: any = {};
    if (partial.slot_id !== undefined) payload.slot_id = partial.slot_id;
    if (partial.desde !== undefined) payload.desde = partial.desde.toISOString();
    if (partial.hasta !== undefined) payload.hasta = partial.hasta.toISOString();
    if (partial.estado !== undefined) payload.estado = partial.estado;
    if (partial.precio_total !== undefined) payload.precio_total = partial.precio_total;
    if (partial.moneda !== undefined) payload.moneda = partial.moneda;
    if (partial.origen !== undefined) payload.origen = partial.origen;
    if (partial.codigo_qr !== undefined) payload.codigo_qr = partial.codigo_qr;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("reservas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as ReservaRow);
  }
}

