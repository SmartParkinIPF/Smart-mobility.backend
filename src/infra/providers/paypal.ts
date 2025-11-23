import { ENV } from "../../config/env";

type BackUrls = { success?: string; pending?: string; failure?: string };

type CreateOrderInput = {
  external_reference: string;
  amount: number;
  currency: string;
  description?: string;
  back_urls?: BackUrls;
};

export type OrderResponse = {
  id: string;
  status?: string;
  approve_url?: string;
  raw?: any;
};

type PaypalLink = { href: string; rel: string; method?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now() + 60_000 // refresh a minute early
  ) {
    return cachedToken.value;
  }

  const clientId = ENV.PAYPAL_CLIENT_ID;
  const clientSecret = ENV.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Configurar PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET");

  const base = ENV.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal auth error ${res.status}: ${text}`);
  }
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 10 * 60 * 1000),
  };
  return cachedToken.value;
}

async function paypalFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const base = ENV.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
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
    throw new Error(`PayPal error ${res.status}: ${text}`);
  }
  return res.json();
}

export const PayPalProvider = {
  async createOrder(input: CreateOrderInput): Promise<OrderResponse> {
    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.external_reference,
          description: input.description?.slice(0, 127),
          amount: {
            currency_code: input.currency,
            value: input.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: input.back_urls?.success,
        cancel_url: input.back_urls?.failure || input.back_urls?.pending,
      },
    };

    const data = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const approve = (data.links as PaypalLink[] | undefined)?.find((l) => l.rel === "approve");

    return {
      id: data.id,
      status: data.status,
      approve_url: approve?.href,
      raw: data,
    };
  },

  async getOrder(orderId: string): Promise<any> {
    return paypalFetch(`/v2/checkout/orders/${orderId}`);
  },

  async captureOrder(orderId: string): Promise<any> {
    return paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
    });
  },
};
