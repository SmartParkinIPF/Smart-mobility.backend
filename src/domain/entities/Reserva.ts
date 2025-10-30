export class Reserva {
  constructor(
    public id: string,
    public usuario_id: string,
    public slot_id: string | null,
    public desde: Date,
    public hasta: Date,
    public estado: string = "pendiente_pago",
    public precio_total: number | null = null,
    public moneda: string = "ARS",
    public origen: string = "web",
    public codigo_qr: string | null = null,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}

