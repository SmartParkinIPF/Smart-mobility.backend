import crypto from "crypto";
import { IReservaRepository } from "../repositories/iReservaRepository";
import { Reserva } from "../entities/Reserva";
import { CreateReservaDto, UpdateReservaDto } from "../dtos/reserva.dto";

export class ReservaService {
  constructor(private readonly repo: IReservaRepository) {}

  async create(usuarioId: string, data: CreateReservaDto) {
    const reserva = new Reserva(
      crypto.randomUUID(),
      usuarioId,
      data.slot_id ?? null,
      data.desde instanceof Date ? data.desde : new Date(data.desde),
      data.hasta instanceof Date ? data.hasta : new Date(data.hasta),
      "pendiente_pago",
      data.precio_total ?? null,
      data.moneda ?? "ARS",
      data.origen ?? "web",
      null
    );

    return this.repo.create(reserva);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async listByUsuario(usuarioId: string, estado?: string) {
    return this.repo.listByUsuario(usuarioId, estado);
  }

  async update(id: string, patch: UpdateReservaDto) {
    const normalized: any = { ...patch };
    if (patch.desde) normalized.desde = patch.desde instanceof Date ? patch.desde : new Date(patch.desde);
    if (patch.hasta) normalized.hasta = patch.hasta instanceof Date ? patch.hasta : new Date(patch.hasta);
    return this.repo.update(id, normalized as Partial<Reserva>);
  }

  async confirmar(id: string, slot_id?: string) {
    const patch: Partial<Reserva> = { estado: "confirmada" };
    if (slot_id) patch.slot_id = slot_id;
    return this.repo.update(id, patch);
  }

  async cancelar(id: string) {
    return this.repo.update(id, { estado: "cancelada" });
  }
}

