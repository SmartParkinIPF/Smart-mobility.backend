import crypto from "crypto";
import { Tarifa } from "../entities/Tarifa";
import { ITarifaRepository } from "../repositories/iTarifaRepository";
import { CreateTarifaDto, UpdateTarifaDto } from "../dtos/tarifa.dto";

export class TarifaService {
  constructor(private readonly repo: ITarifaRepository) {}

  async create(data: CreateTarifaDto) {
    const tarifa = new Tarifa(
      crypto.randomUUID(),
      data.nombre,
      data.moneda ?? "ARS",
      data.modo_calculo,
      data.precio_base ?? null,
      data.precio_por_hora ?? null,
      data.fraccion_min ?? null,
      data.minimo_cobro_min ?? null,
      data.maximo_diario ?? null,
      data.reglas_json ?? null,
      data.vigencia_desde ?? null,
      data.vigencia_hasta ?? null
    );
    return this.repo.create(tarifa);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async list() {
    return this.repo.list();
  }

  async update(id: string, partial: UpdateTarifaDto) {
    return this.repo.update(id, partial as Partial<Tarifa>);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}

