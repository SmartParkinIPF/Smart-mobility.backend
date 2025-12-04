import { Alerta } from "../entities/Alerta";

export type CreateAlertaInput = {
  establecimiento_id: string;
  slot_id: string;
  reporter_user_id: string;
  mensaje?: string | null;
  estado?: string;
};

export interface IAlertaRepository {
  create(input: CreateAlertaInput): Promise<Alerta>;
  findById(id: string): Promise<Alerta | null>;
  listByEstablecimiento(
    establecimientoId: string,
    opts?: { estado?: string | null; limit?: number }
  ): Promise<Alerta[]>;
  markRead(id: string, at?: Date): Promise<Alerta>;
  updateEstado(id: string, estado: string): Promise<Alerta>;
}
