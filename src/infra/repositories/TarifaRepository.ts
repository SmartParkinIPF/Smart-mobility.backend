import { supabaseDB } from "../../config/database";
import { ITarifaRepository } from "../../domain/repositories/iTarifaRepository";
import { Tarifa } from "../../domain/entities/Tarifa";

type TarifaRow = {
  id: string;
  nombre: string;
  moneda: string; // char(3)
  modo_calculo: string;
  precio_base: number | null;
  precio_por_hora: number | null;
  fraccion_min: number | null;
  minimo_cobro_min: number | null;
  maximo_diario: number | null;
  reglas_json: unknown | null;
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  created_at: string;
  updated_at: string;
};

function toDomain(r: TarifaRow): Tarifa {
  return new Tarifa(
    r.id,
    r.nombre,
    r.moneda,
    r.modo_calculo,
    r.precio_base === null ? null : Number(r.precio_base),
    r.precio_por_hora === null ? null : Number(r.precio_por_hora),
    r.fraccion_min === null ? null : Number(r.fraccion_min),
    r.minimo_cobro_min === null ? null : Number(r.minimo_cobro_min),
    r.maximo_diario === null ? null : Number(r.maximo_diario),
    r.reglas_json ?? null,
    r.vigencia_desde ? new Date(r.vigencia_desde) : null,
    r.vigencia_hasta ? new Date(r.vigencia_hasta) : null,
    new Date(r.created_at),
    new Date(r.updated_at)
  );
}

export class TarifasSupabaseRepository implements ITarifaRepository {
  async create(t: Tarifa): Promise<Tarifa> {
    const { data, error } = await supabaseDB
      .from("tarifas")
      .insert({
        id: t.id,
        nombre: t.nombre,
        moneda: t.moneda,
        modo_calculo: t.modo_calculo,
        precio_base: t.precio_base,
        precio_por_hora: t.precio_por_hora,
        fraccion_min: t.fraccion_min,
        minimo_cobro_min: t.minimo_cobro_min,
        maximo_diario: t.maximo_diario,
        reglas_json: t.reglas_json,
        vigencia_desde: t.vigencia_desde,
        vigencia_hasta: t.vigencia_hasta,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data as TarifaRow);
  }

  async findById(id: string): Promise<Tarifa> {
    const { data, error } = await supabaseDB
      .from("tarifas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return toDomain(data as TarifaRow);
  }

  async list(): Promise<Tarifa[]> {
    const { data, error } = await supabaseDB.from("tarifas").select("*");
    if (error) throw error;
    return (data as TarifaRow[]).map(toDomain);
  }

  async update(id: string, partial: Partial<Tarifa>): Promise<Tarifa> {
    const payload: any = {};
    if (partial.nombre !== undefined) payload.nombre = partial.nombre;
    if (partial.moneda !== undefined) payload.moneda = partial.moneda;
    if (partial.modo_calculo !== undefined)
      payload.modo_calculo = partial.modo_calculo;
    if (partial.precio_base !== undefined)
      payload.precio_base = partial.precio_base;
    if (partial.precio_por_hora !== undefined)
      payload.precio_por_hora = partial.precio_por_hora;
    if (partial.fraccion_min !== undefined)
      payload.fraccion_min = partial.fraccion_min;
    if (partial.minimo_cobro_min !== undefined)
      payload.minimo_cobro_min = partial.minimo_cobro_min;
    if (partial.maximo_diario !== undefined)
      payload.maximo_diario = partial.maximo_diario;
    if (partial.reglas_json !== undefined)
      payload.reglas_json = partial.reglas_json;
    if (partial.vigencia_desde !== undefined)
      payload.vigencia_desde = partial.vigencia_desde;
    if (partial.vigencia_hasta !== undefined)
      payload.vigencia_hasta = partial.vigencia_hasta;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseDB
      .from("tarifas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as TarifaRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseDB.from("tarifas").delete().eq("id", id);
    if (error) throw error;
  }
}

