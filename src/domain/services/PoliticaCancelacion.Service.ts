import crypto from "crypto";
import { PoliticaCancelacion } from "../entities/PoliticaCancelacion";
import { IPoliticaCancelacionRepository } from "../repositories/iPoliticaCancelacionRepository";
import {
  CreatePoliticaCancelacionDto,
  UpdatePoliticaCancelacionDto,
} from "../dtos/politica-cancelacion.dto";

export class PoliticaCancelacionService {
  constructor(private readonly repo: IPoliticaCancelacionRepository) {}

  async create(data: CreatePoliticaCancelacionDto, createdBy: string) {
    const p = new PoliticaCancelacion(
      crypto.randomUUID(),
      data.descripcion_corta ?? null,
      data.reglas_json,
      createdBy
    );
    return this.repo.create(p);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async list() {
    return this.repo.list();
  }

  async listByUser(userId: string) {
    return this.repo.listByUser(userId);
  }

  async update(id: string, partial: UpdatePoliticaCancelacionDto) {
    return this.repo.update(id, partial as Partial<PoliticaCancelacion>);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
