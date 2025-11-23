import { Reserva } from "../entities/Reserva";

export interface IReservaRepository {
  create(reserva: Reserva): Promise<Reserva>;
  findById(id: string): Promise<Reserva>;
  listByUsuario(usuarioId: string, estado?: string): Promise<Reserva[]>;
  update(id: string, partial: Partial<Reserva>): Promise<Reserva>;
}

