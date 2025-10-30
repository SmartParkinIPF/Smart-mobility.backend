import { Request, Response, NextFunction } from "express";
import { PagoService } from "../../domain/services/Pago.Service";
import { createPagoSchema } from "../../infra/validators/pago.validator";
import { AppError } from "../../core/errors/AppError";
import { MercadoPagoProvider } from "../../infra/providers/mercadopago";

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

  // Mercado Pago webhook (notifications)
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, action } = req.query as any;
      // data.id contains payment or merchant_order id depending on topic
      const dataId = (req.query?.["data.id"] as string) || (req.body?.data?.id as string);

      if (!dataId) {
        return res.status(200).json({ ok: true });
      }

      if (type === "payment" || action === "payment.created" || action === "payment.updated") {
        const payment = await MercadoPagoProvider.getPayment(dataId);
        const pagoId: string | undefined = payment.external_reference;
        if (pagoId) {
          await this.service.updateEstado(pagoId, {
            estado: this.service.mapMpStatusToEstado(payment.status),
            proveedor_tx_id: String(payment.id),
            recibo_url: payment.receipt_url || payment.ticket_url || null,
          });
        }
      } else if (type === "merchant_order") {
        const order = await MercadoPagoProvider.getMerchantOrder(dataId);
        const pagoId: string | undefined = order.external_reference;
        if (pagoId && order.payments && order.payments.length > 0) {
          const last = order.payments[order.payments.length - 1];
          await this.service.updateEstado(pagoId, {
            estado: this.service.mapMpStatusToEstado(last.status),
            proveedor_tx_id: String(last.id),
          });
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
}

