export type CreateReservaDto = {
  slot_id?: string | null;
  desde: string | Date; // ISO string or Date
  hasta: string | Date; // ISO string or Date
  precio_total?: number | null;
  moneda?: string; // default 'ARS'
  origen?: string; // default 'web'
};

export type UpdateReservaDto = Partial<{
  slot_id: string | null;
  desde: string | Date;
  hasta: string | Date;
  estado: string;
  precio_total: number | null;
  moneda: string;
  origen: string;
  codigo_qr: string | null;
}>;

