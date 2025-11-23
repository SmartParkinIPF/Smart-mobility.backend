export class Opinion {
  constructor(
    public id: string,
    public usuario_id: string,
    public establecimiento_id: string,
    public rating: number,
    public comentario: string | null = null,
    public created_at: Date = new Date()
  ) {}
}
