import crypto from "crypto";
import { IPagoRepository } from "../repositories/iPagoRepository";
import { Pago } from "../entities/Pago";
import { CreatePagoDto, UpdatePagoEstadoDto } from "../dtos/pago.dto";
import { MercadoPagoProvider } from "../../infra/providers/mercadopago";

export class PagoService {
  constructor(private readonly repo: IPagoRepository) {}

  async createIntent(data: CreatePagoDto) {
    const pago = new Pago(
      crypto.randomUUID(),
      data.reserva_id,
      data.metodo ?? "mercado_pago",
      data.monto,
      data.moneda ?? "ARS",
      "pendiente"
    );

    const saved = await this.repo.create(pago);

    const pref = await MercadoPagoProvider.createPreference({
      external_reference: saved.id,
      items: [
        {
          title: data.descripcion || "Pago de reserva",
          description: data.descripcion,
          quantity: 1,
          currency_id: saved.moneda,
          unit_price: Number(saved.monto),
        },
      ],
      back_urls: data.back_urls,
    });

    // Store preference id as proveedor_tx_id to track
    const updated = await this.repo.update(saved.id, {
      proveedor_tx_id: pref.id,
    });

    return { pago: updated, mp: pref };
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

  // Used by webhook: map MP payment status to our domain estado
  mapMpStatusToEstado(mpStatus: string): string {
    const map: Record<string, string> = {
      approved: "aprobado",
      pending: "pendiente",
      rejected: "rechazado",
      refunded: "reembolsado",
      cancelled: "cancelado",
      in_process: "en_proceso",
      in_mediation: "en_disputa",
      charged_back: "chargeback",
    };
    return map[mpStatus] ?? mpStatus;
  }
}

