import crypto from "crypto";
import { AppError } from "../../core/errors/AppError";
import { Opinion } from "../entities/Opinion";
import { IOpinionRepository } from "../repositories/iOpinionRepository";
import { CreateOpinionDto, UpdateOpinionDto } from "../dtos/opinion.dto";

export class OpinionService {
  constructor(private readonly repo: IOpinionRepository) {}

  async create(usuarioId: string, data: CreateOpinionDto) {
    const existing = await this.repo.findByUserAndEstablecimiento(
      usuarioId,
      data.establecimiento_id
    );
    if (existing)
      throw new AppError("Ya existe una opinion tuya para este establecimiento", 409);

    const opinion = new Opinion(
      crypto.randomUUID(),
      usuarioId,
      data.establecimiento_id,
      data.rating,
      data.comentario ?? null
    );
    return this.repo.create(opinion);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async listByEstablecimiento(establecimientoId: string) {
    return this.repo.listByEstablecimiento(establecimientoId);
  }

  async listByUsuario(usuarioId: string, establecimientoId?: string) {
    return this.repo.listByUsuario(usuarioId, establecimientoId);
  }

  async updateOwn(id: string, usuarioId: string, patch: UpdateOpinionDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Opinion no encontrada", 404);
    if (existing.usuario_id !== usuarioId)
      throw new AppError("No autorizado para editar esta opinion", 403);

    const normalized: Partial<Opinion> = {};
    if (patch.rating !== undefined) normalized.rating = patch.rating;
    if (patch.comentario !== undefined) normalized.comentario = patch.comentario ?? null;

    return this.repo.update(id, normalized);
  }

  async deleteOwn(id: string, usuarioId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Opinion no encontrada", 404);
    if (existing.usuario_id !== usuarioId)
      throw new AppError("No autorizado para eliminar esta opinion", 403);
    await this.repo.delete(id);
  }
}
