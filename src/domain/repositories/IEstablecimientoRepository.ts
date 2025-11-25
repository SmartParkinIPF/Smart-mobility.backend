import { Establecimiento } from "../entities/Establecimiento";

export interface IEstablecimientoRepository {
  create(est: Establecimiento): Promise<Establecimiento>;
  findById(id: string): Promise<Establecimiento | null>;
  list(): Promise<Establecimiento[]>;
  listWithParkings(): Promise<
    { est: Establecimiento; parkings: { id: string; tipo: string | null }[] }[]
  >;
  listByOwner(ownerId: string): Promise<Establecimiento[]>;
  update(id: string, partial: Partial<Establecimiento>): Promise<Establecimiento>;
  delete(id: string): Promise<void>;
}
