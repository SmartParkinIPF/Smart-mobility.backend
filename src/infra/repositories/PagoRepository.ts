import { supabaseDB } from "../../config/database";
import { IPagoRepository } from "../../domain/repositories/iPagoRepository";
import { Pago } from "../../domain/entities/Pago";

type PagoRow = {
  id: string;
  reserva_id: string;
  metodo: string;
  monto: number;
  moneda: string;
  estado: string;
  proveedor_tx_id: string | null;
  recibo_url: string | null;
  created_at: string;
};

function toDomain(r: PagoRow): Pago {
  return new Pago(
    r.id,
    r.reserva_id,
    r.metodo,
    Number(r.monto),
    r.moneda,
    r.estado,
    r.proveedor_tx_id,
    r.recibo_url,
    new Date(r.created_at)
  );
}

export class PagosSupabaseRepository implements IPagoRepository {
  async create(p: Pago): Promise<Pago> {
    const { data, error } = await supabaseDB
      .from("pagos")
      .insert({
        id: p.id,
        reserva_id: p.reserva_id,
        metodo: p.metodo,
        monto: p.monto,
        moneda: p.moneda,
        estado: p.estado,
        proveedor_tx_id: p.proveedor_tx_id,
        recibo_url: p.recibo_url,
        created_at: p.created_at.toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as PagoRow);
  }

  async findById(id: string): Promise<Pago> {
    const { data, error } = await supabaseDB
      .from("pagos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return toDomain(data as PagoRow);
  }

  async findByReserva(reservaId: string): Promise<Pago[]> {
    const { data, error } = await supabaseDB
      .from("pagos")
      .select("*")
      .eq("reserva_id", reservaId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PagoRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<Pago>): Promise<Pago> {
    const payload: any = {};
    if (partial.metodo !== undefined) payload.metodo = partial.metodo;
    if (partial.monto !== undefined) payload.monto = partial.monto;
    if (partial.moneda !== undefined) payload.moneda = partial.moneda;
    if (partial.estado !== undefined) payload.estado = partial.estado;
    if (partial.proveedor_tx_id !== undefined)
      payload.proveedor_tx_id = partial.proveedor_tx_id;
    if (partial.recibo_url !== undefined) payload.recibo_url = partial.recibo_url;

    const { data, error } = await supabaseDB
      .from("pagos")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as PagoRow);
  }
}

