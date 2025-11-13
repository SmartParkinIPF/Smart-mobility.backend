import { Horario } from "../entities/horario";

export interface IHorarioRepository {
  created(hor: Horario): Promise<Horario>;
  findById(id: string): Promise<Horario>;
  list(): Promise<Horario[]>;
  listByUser(userId: string): Promise<Horario[]>;
  update(id: string, partial: Partial<Horario>): Promise<Horario>;
  delete(id: string): Promise<void>;
}
