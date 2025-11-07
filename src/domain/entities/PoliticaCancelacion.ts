export class PoliticaCancelacion {
  constructor(
    public id: string,
    public descripcion_corta: string | null,
    public reglas_json: unknown,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}

