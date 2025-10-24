import { Tarifa } from "../entities/Tarifa";

export interface ITarifaRepository {
  create(tarifa: Tarifa): Promise<Tarifa>;
  findById(id: string): Promise<Tarifa>;
  list(): Promise<Tarifa[]>;
  update(id: string, partial: Partial<Tarifa>): Promise<Tarifa>;
  delete(id: string): Promise<void>;
}

