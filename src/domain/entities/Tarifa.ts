export class Tarifa {
  constructor(
    public id: string,
    public nombre: string,
    public moneda: string,
    public modo_calculo: string,
    public precio_base: number | null,
    public precio_por_hora: number | null,
    public fraccion_min: number | null,
    public minimo_cobro_min: number | null,
    public maximo_diario: number | null,
    public reglas_json: unknown | null,
    public vigencia_desde: Date | null,
    public vigencia_hasta: Date | null,
    public created_by: string | null = null,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}
