export type CreatePagoDto = {
  reserva_id: string;
  monto: number;
  moneda?: string; // default 'ARS'
  metodo?: string; // default 'mercado_pago'
  descripcion?: string;
  // optional back urls for MP checkout
  back_urls?: {
    success?: string;
    pending?: string;
    failure?: string;
  };
};

export type UpdatePagoEstadoDto = {
  estado: string;
  proveedor_tx_id?: string | null;
  recibo_url?: string | null;
};

