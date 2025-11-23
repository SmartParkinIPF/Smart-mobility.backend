export class Pago {
  constructor(
    public id: string,
    public reserva_id: string,
    public metodo: string,
    public monto: number,
    public moneda: string = "ARS",
    public estado: string = "pendiente",
    public proveedor_tx_id: string | null = null,
    public recibo_url: string | null = null,
    public created_at: Date = new Date()
  ) {}
}

