import { Pago } from "../entities/Pago";

export interface IPagoRepository {
  create(pago: Pago): Promise<Pago>;
  findById(id: string): Promise<Pago>;
  findByReserva(reservaId: string): Promise<Pago[]>;
  update(id: string, partial: Partial<Pago>): Promise<Pago>;
}

