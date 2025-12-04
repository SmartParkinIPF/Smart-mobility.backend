import { Notificacion } from "../entities/Notificacion";

export type CreateNotificacionInput = {
  user_id: string;
  titulo: string;
  mensaje: string;
  estado?: string;
};

export interface INotificacionRepository {
  create(input: CreateNotificacionInput): Promise<Notificacion>;
  listByUser(userId: string, limit?: number): Promise<Notificacion[]>;
  markLeida(id: string): Promise<Notificacion>;
}
