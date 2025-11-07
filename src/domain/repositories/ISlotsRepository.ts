import { Slots } from "../entities/Slots";

export interface ISlotsRepository {
  create(slot: Slots): Promise<Slots>; 
  findById(id: string): Promise<Slots | null>;
  list(): Promise<Slots[]>;
  listByEstacionamiento(estacionamientoId: string): Promise<Slots[]>;
  update(id: string, partial: Partial<Slots>): Promise<Slots>;
  delete(id: string): Promise<void>;
}

