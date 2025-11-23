import { Estacionamiento } from "../entities/Estacionamiento";

export interface IEstacionamientoRepository {
  create(park: Estacionamiento): Promise<Estacionamiento>;
  findById(id: string): Promise<Estacionamiento | null>;
  list(): Promise<Estacionamiento[]>;
  listByEstablecimiento(establecimientoId: string): Promise<Estacionamiento[]>;
  update(id: string, partial: Partial<Estacionamiento>): Promise<Estacionamiento>;
  delete(id: string): Promise<void>;
}
