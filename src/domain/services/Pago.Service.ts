import crypto from "crypto";
import { IPagoRepository } from "../repositories/iPagoRepository";
import { Pago } from "../entities/Pago";
import { CreatePagoDto, UpdatePagoEstadoDto } from "../dtos/pago.dto";
import { PayPalProvider } from "../../infra/providers/paypal";
import { ENV } from "../../config/env";

export class PagoService {
  constructor(private readonly repo: IPagoRepository) {}

  async createIntent(data: CreatePagoDto) {
    // Algunos entornos tienen enum limitado para metodo; probamos caídas de respaldo.
    const metodoCandidates = Array.from(
      new Set([
        data.metodo ?? "paypal",
        "mercadopago",
        "mp",
        "online",
        "tarjeta",
        "efectivo",
      ])
    );

    let saved: Pago | null = null;
    let lastErr: any = null;
    for (const metodo of metodoCandidates) {
      try {
        const pago = new Pago(
          crypto.randomUUID(),
          data.reserva_id,
          metodo,
          data.monto,
          data.moneda ?? "USD",
          "pendiente"
        );
        saved = await this.repo.create(pago);
        break;
      } catch (err: any) {
        lastErr = err;
        const code = (err as any)?.code || (err as any)?.message;
        if (code && String(code).includes("22P02")) {
          // enum invalido: probar siguiente candidato
          continue;
        }
        throw err;
      }
    }

    if (!saved) throw lastErr || new Error("No se pudo crear el pago");

    const fallbackSuccess =
      `${ENV.PUBLIC_BASE_URL || `http://localhost:${ENV.PORT}`}/api/pagos/return/success`;
    const fallbackPending =
      `${ENV.PUBLIC_BASE_URL || `http://localhost:${ENV.PORT}`}/api/pagos/return/pending`;
    const fallbackFailure =
      `${ENV.PUBLIC_BASE_URL || `http://localhost:${ENV.PORT}`}/api/pagos/return/failure`;

    const order = await PayPalProvider.createOrder({
      external_reference: saved.id,
      amount: Number(saved.monto),
      currency: saved.moneda,
      description: data.descripcion || "Pago de reserva",
      back_urls:
        data.back_urls ?? {
          success: fallbackSuccess,
          pending: fallbackPending,
          failure: fallbackFailure,
        },
    });

    // Store order id as proveedor_tx_id to track
    const updated = await this.repo.update(saved.id, {
      proveedor_tx_id: order.id,
    });

    return { pago: updated, paypal: order };
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async listByReserva(reservaId: string) {
    return this.repo.findByReserva(reservaId);
  }

  async updateEstado(id: string, partial: UpdatePagoEstadoDto) {
    return this.repo.update(id, partial as Partial<Pago>);
  }

  async captureAndUpdateByOrderId(orderId: string) {
    const capture = await PayPalProvider.captureOrder(orderId);
    const ppStatus: string =
      (capture?.status as string | undefined) ||
      (capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status as string | undefined) ||
      "COMPLETED";
    const estado = this.mapPaypalStatusToEstado(ppStatus);
    const reciboUrl: string | null =
      Array.isArray(capture?.links) && capture.links.length > 0
        ? capture.links.find((l: any) => l.rel === "self")?.href || null
        : null;

    const pago = await this.repo.findByProveedorTxId(orderId);
    let updated: Pago | null = null;
    if (pago) {
      updated = await this.repo.update(pago.id, {
        estado,
        proveedor_tx_id: orderId,
        recibo_url: reciboUrl,
      });
    }
    return { pago: updated, estado, capture };
  }

  // Used by webhook: map PayPal payment status to our domain estado
  mapPaypalStatusToEstado(ppStatus: string): string {
    const normalized = ppStatus?.toUpperCase?.() ?? ppStatus;
    const map: Record<string, string> = {
      COMPLETED: "aprobado",
      APPROVED: "pendiente",
      CREATED: "pendiente",
      SAVED: "pendiente",
      VOIDED: "cancelado",
      PAYER_ACTION_REQUIRED: "pendiente",
      PENDING: "pendiente",
      DECLINED: "rechazado",
      REFUNDED: "reembolsado",
      PARTIALLY_REFUNDED: "reembolsado",
    };
    return map[normalized] ?? normalized.toLowerCase?.() ?? normalized;
  }
}
