import crypto from "crypto";
import { CreateSlotDTO } from "../dtos/slots.dto";
import { Slots } from "../entities/Slots";
import { ISlotsRepository } from "../repositories/ISlotsRepository";

export class SlotsService {
  constructor(private readonly repo: ISlotsRepository) {}

  async create(data: CreateSlotDTO) {
    const slot = new Slots(
      crypto.randomUUID(),
      data.estacionamiento_id,
      data.codigo,
      data.tipo,
      data.ancho_cm,
      data.largo_cm,
      data.ubicacion_local,
      data.estado_operativo,
      data.tarifa_id,
      data.es_reservable
    );
    return this.repo.create(slot);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async list() {
    return this.repo.list();
  }

  async listByEstacionamiento(estacionamientoId: string) {
    return this.repo.listByEstacionamiento(estacionamientoId);
  }

  async update(id: string, partial: Partial<Slots>) {
    return this.repo.update(id, partial);
  }

  async delete(id: string) {
    await this.repo.delete(id);
  }
}

