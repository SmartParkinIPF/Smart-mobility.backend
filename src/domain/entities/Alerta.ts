export class Alerta {
  constructor(
    public readonly id: string,
    public readonly establecimiento_id: string,
    public readonly slot_id: string,
    public readonly reporter_user_id: string,
    public readonly mensaje: string | null,
    public readonly estado: string,
    public readonly created_at: Date,
    public readonly viewed_at: Date | null
  ) {}
}
