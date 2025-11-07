import { Horario } from "../entities/horario";
import { IHorarioRepository } from "../repositories/iHorarioRepository";
import crypto from "crypto";
import { HorarioDto } from "../dtos/horario.dto";

export class HorarioService {
  constructor(private readonly repo: IHorarioRepository) {}

  async create(data: HorarioDto) {
    const horario = new Horario(
      crypto.randomUUID(),
      data.id_usuario,
      data.tipo,
      data.definicion
    );
    return this.repo.created(horario);
  }
  async findById(id: string) {
    return this.repo.findById(id);
  }
  async list() {
    return this.repo.list();
  }
  async update(id: string, partial: Partial<Horario>) {
    return this.repo.update(id, partial);
  }
  async delete(id: string) {
    return this.repo.delete(id);
  }
}
