export type CreateTarifaDto = {
  nombre: string;
  moneda?: string; // default 'ARS'
  modo_calculo: string;
  precio_base?: number | null;
  precio_por_hora?: number | null;
  fraccion_min?: number | null;
  minimo_cobro_min?: number | null;
  maximo_diario?: number | null;
  reglas_json?: unknown | null;
  vigencia_desde?: Date | null;
  vigencia_hasta?: Date | null;
};

export type UpdateTarifaDto = Partial<CreateTarifaDto>;

