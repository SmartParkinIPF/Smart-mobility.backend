import crypto from "crypto";
import { IAuthUserRepository } from "../repositories/iAuthUserRepository";
import { IEstacionamientoRepository } from "../repositories/iEstacionamientoRepository";
import { IUserRepository } from "../repositories/IUserRepository";
import { CreateEstacionamientoDTO } from "../dtos/estacionamiento.dto";
import { Estacionamiento } from "../entities/Estacionamiento";

export class EstacionamientoService {
  constructor(
    private readonly repo: IEstacionamientoRepository,
    private readonly user: IUserRepository,
    private readonly authUser: IAuthUserRepository
  ) {}

  async create(data: CreateEstacionamientoDTO) {
    const est = new Estacionamiento(
      crypto.randomUUID(),
      data.establecimiento_id,
      data.nombre,
      data.tipo,
      data.soporta_discapacidad,
      data.soporta_motos,
      data.soporta_electricos,
      data.tiene_cargadores,
      data.cantidad_cargadores,
      data.tarifa_id,
      data.horario_id,
      data.politica_cancelacion_id,
      data.estado || "activo",
      data.ubicacion,
      data.perimetro_est
    );
    return this.repo.create(est);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async list() {
    return this.repo.list();
  }

  async listByEstablecimiento(establecimientoId: string) {
    return this.repo.listByEstablecimiento(establecimientoId);
  }

  async update(
    id: string,
    partial: Partial<Estacionamiento>
  ): Promise<Estacionamiento> {
    return this.repo.update(id, partial);
  }

  async delete(id: string) {
    await this.repo.delete(id);
  }
}
