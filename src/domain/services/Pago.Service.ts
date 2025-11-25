import crypto from "crypto";
import { IPagoRepository } from "../repositories/iPagoRepository";
import { Pago } from "../entities/Pago";
import { CreatePagoDto, UpdatePagoEstadoDto } from "../dtos/pago.dto";
import { PayPalProvider } from "../../infra/providers/paypal";

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

    const order = await PayPalProvider.createOrder({
      external_reference: saved.id,
      amount: Number(saved.monto),
      currency: saved.moneda,
      description: data.descripcion || "Pago de reserva",
      back_urls:
        data.back_urls ?? {
          success: "https://smartparking.com/pago/success",
          pending: "https://smartparking.com/pago/pending",
          failure: "https://smartparking.com/pago/failure",
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
