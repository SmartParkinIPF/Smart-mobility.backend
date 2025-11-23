import { Request, Response, NextFunction } from "express";
import { PagoService } from "../../domain/services/Pago.Service";
import { createPagoSchema } from "../../infra/validators/pago.validator";
import { AppError } from "../../core/errors/AppError";
import { PayPalProvider } from "../../infra/providers/paypal";

export class PagosController {
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
}

