import { Request, Response, NextFunction } from "express";
import { ReservaService } from "../../domain/services/Reserva.Service";
import {
  createReservaSchema,
  updateReservaSchema,
  confirmReservaSchema,
} from "../../infra/validators/reserva.validator";
import { AppError } from "../../core/errors/AppError";
import { PagoService } from "../../domain/services/Pago.Service";
import { PagosSupabaseRepository } from "../../infra/repositories/PagoRepository";
import { SlotsService } from "../../domain/services/Slots.Service";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";

export class ReservasController {
  private pagoService = new PagoService(new PagosSupabaseRepository());
  private slotService = new SlotsService(new SlotsSupabaseRepository());
  constructor(private readonly service: ReservaService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const parsed = createReservaSchema.parse(req.body);
      const created = await this.service.create(user.id, parsed);
      res.status(201).json(created);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reserva = await this.service.findById(id);
      res.status(200).json(reserva);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  myList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const estado = (req.query.estado as string) || undefined;
      const reservas = await this.service.listByUsuario(user.id, estado);
      res.status(200).json(reservas);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateReservaSchema.parse(req.body);
      const updated = await this.service.update(id, parsed);
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  confirmar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { slot_id } = confirmReservaSchema.parse(req.body ?? {});
      const updated = await this.service.confirmar(id, slot_id);
      if (updated?.slot_id) {
        // Marcar slot como reservado
        await this.slotService.update(updated.slot_id, { estado_operativo: "reservado" } as any);
      }
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  cancelar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await this.service.cancelar(id);
      if (updated?.slot_id) {
        // Liberar slot al cancelar
        await this.slotService.update(updated.slot_id, { estado_operativo: "operativo" } as any);
      }
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  // Opcional: crear la intención de pago para la reserva
  crearPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // reserva id
      const { monto, moneda, descripcion, back_urls } = req.body || {};
      if (!monto || typeof monto !== "number")
        throw new AppError("monto requerido", 400);

      const result = await this.pagoService.createIntent({
        reserva_id: id,
        monto,
        moneda,
        descripcion,
        back_urls,
      });
      res.status(201).json(result);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  private toAppError(err: unknown) {
    if ((err as any)?.issues)
      return new AppError("Validación fallida", 400, (err as any).issues);
    return err as any;
  }
}

