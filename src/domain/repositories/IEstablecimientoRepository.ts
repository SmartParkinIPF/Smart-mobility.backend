import { Establecimiento } from "../entities/Establecimiento";

export interface IEstablecimientoRepository {
  create(est: Establecimiento): Promise<Establecimiento>;
  findById(id: string): Promise<Establecimiento | null>;
  list(): Promise<Establecimiento[]>;
  listByOwner(ownerId: string): Promise<Establecimiento[]>;
  update(id: string, partial: Partial<Establecimiento>): Promise<Establecimiento>;
  delete(id: string): Promise<void>;
}
