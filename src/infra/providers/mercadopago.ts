import { ENV } from "../../config/env";

type PreferenceItem = {
  title: string;
  description?: string;
  quantity: number;
  currency_id: string; // e.g., 'ARS'
  unit_price: number;
};

type CreatePreferenceInput = {
  external_reference: string; // we will use pago.id
  items: PreferenceItem[];
  back_urls?: { success?: string; pending?: string; failure?: string };
  notification_url?: string;
};

export type PreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

async function mpFetch(path: string, init?: RequestInit) {
  const token = ENV.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no configurado");
  const base = "https://api.mercadopago.com";
  const res = await fetch(base + path, {
    ...(init || {}),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MercadoPago error ${res.status}: ${text}`);
  }
  return res.json();
}

export const MercadoPagoProvider = {
  async createPreference(input: CreatePreferenceInput): Promise<PreferenceResponse> {
    const body = {
      external_reference: input.external_reference,
      items: input.items,
      back_urls: input.back_urls,
      notification_url: input.notification_url || ENV.MP_WEBHOOK_URL || undefined,
      auto_return: "approved" as const,
    };
    const data = await mpFetch("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return {
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    };
  },

  async getPayment(paymentId: string): Promise<any> {
    return mpFetch(`/v1/payments/${paymentId}`);
  },

  async getMerchantOrder(orderId: string): Promise<any> {
    return mpFetch(`/merchant_orders/${orderId}`);
  },
};

