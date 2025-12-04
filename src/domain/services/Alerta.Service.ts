import { AppError } from "../../core/errors/AppError";
import { Alerta } from "../entities/Alerta";
import {
  CreateAlertaInput,
  IAlertaRepository,
} from "../repositories/IAlertaRepository";
import { ISlotsRepository } from "../repositories/ISlotsRepository";
import { IEstacionamientoRepository } from "../repositories/iEstacionamientoRepository";
import { IUserRepository } from "../repositories/IUserRepository";
import { Slots } from "../entities/Slots";

export class AlertaService {
  constructor(
    private readonly alertas: IAlertaRepository,
    private readonly slots: ISlotsRepository,
    private readonly estacionamientos: IEstacionamientoRepository,
    private readonly users: IUserRepository
  ) {}

  private async resolveSlot(slotId: string): Promise<Slots> {
    const slot = await this.slots.findById(slotId);
    if (!slot) throw new AppError("Slot no encontrado", 404);
    return slot;
  }

  async crear(
    requesterId: string,
    input: { slot_id: string; mensaje?: string | null }
  ): Promise<Alerta> {
    const slot = await this.resolveSlot(input.slot_id);
    const estacionamiento = await this.estacionamientos.findById(
      slot.estacionamiento_id
    );
    if (!estacionamiento) throw new AppError("Estacionamiento no encontrado", 404);
    const establecimientoId = estacionamiento.establecimiento_id;
    if (!establecimientoId)
      throw new AppError("El slot no tiene establecimiento asociado", 400);

    const alerta = await this.alertas.create({
      establecimiento_id: establecimientoId,
      slot_id: slot.id,
      reporter_user_id: requesterId,
      mensaje: input.mensaje ?? null,
      estado: "pendiente",
    });

    // Best-effort: bloquear el slot mientras se atiende la alerta
    try {
      await this.slots.update(slot.id, {
        estado_operativo: "bloqueado",
      } as any);
    } catch {
      // no bloquear en caso de fallo
    }

    return alerta;
  }

  async listarPorEncargado(
    encargadoId: string,
    estado?: string | null,
    limit = 50
  ): Promise<Alerta[]> {
    const encargado = await this.users.findById(encargadoId);
    if (!encargado) throw new AppError("No autenticado", 401);
    if (encargado.role !== "encargado")
      throw new AppError("Solo encargados pueden ver alertas", 403);
    if (!encargado.establecimiento_id)
      throw new AppError("Encargado sin establecimiento asignado", 400);
    return this.alertas.listByEstablecimiento(encargado.establecimiento_id, {
      estado: estado ?? undefined,
      limit,
    });
  }

  private async assertOwnership(encargadoId: string, alertaId: string): Promise<Alerta> {
    const alerta = await this.alertas.findById(alertaId);
    if (!alerta) throw new AppError("Alerta no encontrada", 404);
    const encargado = await this.users.findById(encargadoId);
    if (!encargado) throw new AppError("No autenticado", 401);
    if (encargado.role !== "encargado")
      throw new AppError("Solo encargados pueden actualizar alertas", 403);
    if (!encargado.establecimiento_id)
      throw new AppError("Encargado sin establecimiento asignado", 400);
    if (encargado.establecimiento_id !== alerta.establecimiento_id)
      throw new AppError("No autorizado para esta alerta", 403);
    return alerta;
  }

  async marcarLeida(encargadoId: string, alertaId: string): Promise<Alerta> {
    await this.assertOwnership(encargadoId, alertaId);
    return this.alertas.markRead(alertaId, new Date());
  }

  async actualizarEstado(
    encargadoId: string,
    alertaId: string,
    estado: string
  ): Promise<Alerta> {
    await this.assertOwnership(encargadoId, alertaId);
    return this.alertas.updateEstado(alertaId, estado);
  }

  async resolver(
    encargadoId: string,
    alertaId: string
  ): Promise<Alerta> {
    const alerta = await this.assertOwnership(encargadoId, alertaId);
    // Marcar atendido
    const updated = await this.alertas.updateEstado(alertaId, "atendido");
    // Dejar slot en reservado nuevamente (best-effort)
    try {
      await this.slots.update(alerta.slot_id, { estado_operativo: "reservado" } as any);
    } catch {
      // ignorar fallo de actualizacion de slot
    }
    return updated;
  }
}
