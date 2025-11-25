import { Request, Response, NextFunction } from "express";
import { PagoService } from "../../domain/services/Pago.Service";
import { createPagoSchema } from "../../infra/validators/pago.validator";
import { AppError } from "../../core/errors/AppError";
import { PayPalProvider } from "../../infra/providers/paypal";
import { ReservaService } from "../../domain/services/Reserva.Service";
import { ReservasSupabaseRepository } from "../../infra/repositories/ReservaRepository";
import { SlotsService } from "../../domain/services/Slots.Service";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";
import { PagosSupabaseRepository } from "../../infra/repositories/PagoRepository";

export class PagosController {
  private reservaService = new ReservaService(new ReservasSupabaseRepository());
  private pagoRepo = new PagosSupabaseRepository();
  private slotService = new SlotsService(new SlotsSupabaseRepository());
  constructor(private readonly service: PagoService) {}

  createIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createPagoSchema.parse(req.body);
      const result = await this.service.createIntent(parsed);
      res.status(201).json(result);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const pago = await this.service.getById(id);
      res.status(200).json(pago);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  listByReserva = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservaId } = req.params;
      const pagos = await this.service.listByReserva(reservaId);
      res.status(200).json(pagos);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  // PayPal webhook (notifications)
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = req.body as any;
      const eventType: string | undefined = event?.event_type;
      const resource: any = event?.resource || {};

      if (!eventType || !resource) return res.status(200).json({ ok: true });

      const purchaseUnit = (resource.purchase_units || [])[0];
      let pagoId: string | undefined =
        purchaseUnit?.reference_id ||
        purchaseUnit?.custom_id ||
        resource.reference_id ||
        resource.invoice_id;

      const relatedOrderId: string | undefined =
        resource.id || resource.supplementary_data?.related_ids?.order_id;

      if (!pagoId && relatedOrderId) {
        const order = await PayPalProvider.getOrder(relatedOrderId);
        pagoId = order?.purchase_units?.[0]?.reference_id;
        if (order?.status) resource.status = order.status;
      }

      if (!pagoId) return res.status(200).json({ ok: true });

      const paypalStatus: string =
        (resource.status as string | undefined) ||
        (eventType?.includes(".") ? eventType.split(".").pop() : eventType) ||
        "PENDING";

      const reciboUrl: string | null =
        Array.isArray(resource.links) && resource.links.length > 0
          ? resource.links.find((l: any) => l.rel === "self")?.href || null
          : null;

      await this.service.updateEstado(pagoId, {
        estado: this.service.mapPaypalStatusToEstado(paypalStatus),
        proveedor_tx_id: (resource.id as string | undefined) || relatedOrderId || null,
        recibo_url: reciboUrl,
      });

      // Si el pago quedó aprobado, intentamos marcar la reserva como "reservada"
      const newEstado = this.service.mapPaypalStatusToEstado(paypalStatus);
      if (newEstado === "aprobado") {
        try {
          const pago = await this.service.getById(pagoId);
          if (pago?.reserva_id) {
            const updatedReserva = await this.reservaService.update(pago.reserva_id, { estado: "reservada" });
            if (updatedReserva?.slot_id) {
              await this.slotService.update(updatedReserva.slot_id, { estado_operativo: "reservado" } as any);
            }
          }
        } catch (err) {
          // no interrumpimos el webhook si falla la actualización de reserva
          console.error("No se pudo actualizar reserva tras pago", err);
        }
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  private toAppError(err: unknown) {
    if ((err as any)?.issues)
      return new AppError("Validación fallida", 400, (err as any).issues);
    return err as any;
  }

  // Manejo de return de PayPal (captura orden y actualiza reserva)
  returnSuccess = async (req: Request, res: Response) => {
    const orderId = (req.query.token as string) || (req.query.orderId as string);
    if (!orderId) return res.status(400).send("Falta token de pago");
    try {
      const result = await this.service.captureAndUpdateByOrderId(orderId);
      if (result?.pago?.reserva_id) {
        const reserva = await this.reservaService.update(result.pago.reserva_id, { estado: "reservada" });
        if (reserva?.slot_id) {
          await this.slotService.update(reserva.slot_id, { estado_operativo: "reservado" } as any);
        }
      }
      const html = this.htmlReturn(
        "Pago completado",
        "Pago capturado con éxito. Ya podés volver a la app."
      );
      return res.status(200).send(html);
    } catch (e: any) {
      const html = this.htmlReturn(
        "Pago completado",
        "Pago aprobado, pero hubo un problema al confirmar la reserva. Revisa el estado en la app."
      );
      return res.status(200).send(html);
    }
  };

  returnPending = (_req: Request, res: Response) => {
    const html = this.htmlReturn("Pago pendiente", "Tu pago quedó pendiente o en revisión.");
    return res.status(200).send(html);
  };

  returnFailure = (_req: Request, res: Response) => {
    const html = this.htmlReturn("Pago cancelado", "El pago fue cancelado o falló.");
    return res.status(200).send(html);
  };

  private htmlReturn(title: string, message: string) {
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body { font-family: Arial, sans-serif; background:#0b1220; color:#e5e7eb; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:16px; }
.box { background:#111827; padding:24px 20px; border-radius:14px; border:1px solid #1f2937; max-width:420px; text-align:center; }
h1 { margin:0 0 12px; font-size:22px; }
p { margin:6px 0; line-height:1.5; color:#cbd5e1; }
.hint { font-size:14px; color:#94a3b8; }
</style></head><body><div class="box">
<h1>${title}</h1>
<p>${message}</p>
<p class="hint">Ya podés volver a la app para ver el estado actualizado.</p>
</div></body></html>`;
  }
}
