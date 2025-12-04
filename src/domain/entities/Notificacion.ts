export class Notificacion {
  constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly titulo: string,
    public readonly mensaje: string,
    public readonly estado: string,
    public readonly created_at: Date
  ) {}
}
