import { PoliticaCancelacion } from "../entities/PoliticaCancelacion";

export interface IPoliticaCancelacionRepository {
  create(p: PoliticaCancelacion): Promise<PoliticaCancelacion>;
  findById(id: string): Promise<PoliticaCancelacion>;
  list(): Promise<PoliticaCancelacion[]>;
  listByUser(userId: string): Promise<PoliticaCancelacion[]>;
  update(
    id: string,
    partial: Partial<PoliticaCancelacion>
  ): Promise<PoliticaCancelacion>;
  delete(id: string): Promise<void>;
}
