import { Opinion } from "../entities/Opinion";

export interface IOpinionRepository {
  create(opinion: Opinion): Promise<Opinion>;
  findById(id: string): Promise<Opinion | null>;
  findByUserAndEstablecimiento(usuarioId: string, establecimientoId: string): Promise<Opinion | null>;
  listByEstablecimiento(establecimientoId: string): Promise<Opinion[]>;
  listByUsuario(usuarioId: string, establecimientoId?: string): Promise<Opinion[]>;
  update(id: string, partial: Partial<Opinion>): Promise<Opinion>;
  delete(id: string): Promise<void>;
}
