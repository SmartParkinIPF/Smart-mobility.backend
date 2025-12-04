import { Notificacion } from "../entities/Notificacion";
import {
  CreateNotificacionInput,
  INotificacionRepository,
} from "../repositories/INotificacionRepository";

export class NotificacionService {
  constructor(private readonly repo: INotificacionRepository) {}

  crear(input: CreateNotificacionInput): Promise<Notificacion> {
    return this.repo.create(input);
  }

  listar(userId: string, limit?: number): Promise<Notificacion[]> {
    return this.repo.listByUser(userId, limit);
  }

  marcarLeida(id: string): Promise<Notificacion> {
    return this.repo.markLeida(id);
  }
}
