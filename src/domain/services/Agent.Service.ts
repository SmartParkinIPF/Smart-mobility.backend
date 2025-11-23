//Luca agregó esta parte del backend

import { CreateReservaDto } from "../dtos/reserva.dto";
import { Estacionamiento } from "../entities/Estacionamiento";
import { Reserva } from "../entities/Reserva";
import { EstacionamientoService } from "./Estacionamiento.Service";
import { ReservaService } from "./Reserva.Service";
import { ENV } from "../../config/env";
import { env } from "process";

/**
 * Posibles intents reconocidos por el agente.  A medida que se soporten
 * nuevas funcionalidades deberán añadirse aquí y en el switch del método
 * `processUserMessage`.
 */
export type AgentIntent = "FIND_PARKING" | "CREATE_RESERVATION";

/**
 * Resultado de la llamada a la API de Gemini.  La propiedad `intent`
 * determina la acción a ejecutar y `entities` contiene los parámetros
 * extraídos del mensaje del usuario (p.ej. estacionamientoId, fechas, etc.).
 */
export interface GeminiResponse {
    intent: AgentIntent;
    entities: Record<string, unknown>;
}

/**
 * Representa la identidad del usuario autenticado.  El middleware de JWT
 * debe inyectar este objeto en `req.user` para que el agente sepa quién
 * es el remitente de la solicitud.
 */
export interface AuthUserPayload {
    id: string;
    email: string;
    role: string;
}

/**
 * Servicio de orquestación del agente conversacional.  Encapsula la
 * integración con Gemini y el enrutamiento de intents hacia los servicios
 * de dominio existentes.  No contiene ninguna lógica de negocio propia,
 * simplemente delega en las capas ya definidas en el dominio.
 */
export class AgentService {
  constructor(
    private readonly estacionamientoService: EstacionamientoService,
    private readonly reservaService: ReservaService
  ) {}

  /**
   * Punto de entrada principal para procesar un mensaje del usuario.  Se
   * comunica con Gemini para obtener el intent y las entidades, luego
   * delega en los servicios de dominio para ejecutar la acción solicitada.
   *
   * @param message Mensaje ingresado por el usuario en lenguaje natural.
   * @param user Datos del usuario autenticado.
   */
  async processUserMessage(
    message: string,
    user: AuthUserPayload
  ): Promise<unknown> {
    // Llamar a Gemini para inferir la intención y entidades.
    const gemini = await this.callGemini(message);
    switch (gemini.intent) {
      case "FIND_PARKING":
        return this.handleFindParking(gemini.entities, user);
      case "CREATE_RESERVATION":
        return this.handleCreateReservation(gemini.entities, user);
      default:
        return {
          reply:
            "Lo siento, no puedo reconocer tu solicitud. Por favor intenta reformular la pregunta.",
        };
    }
  }

  /**
   * Lógica para el intent FIND_PARKING.  Realiza una búsqueda de
   * estacionamientos disponibles utilizando el servicio de Estacionamiento.
   * Puede filtrar por ciudad u otros parámetros contenidos en `entities`.
   */
  private async handleFindParking(
    entities: Record<string, unknown>,
    _user: AuthUserPayload
  ) {
    try {
      // Extraer filtros de las entidades (p.ej. ciudad, coordenadas).
      const city = entities["city"] as string | undefined;
      // Llamar al servicio de dominio.  Si en el futuro se define un
      // método de búsqueda geolocalizada, este es el lugar para invocarlo.
      let estacionamientos: Estacionamiento[];
      if (city) {
        // Suponemos que existe un método listByCity; si no, fallback a list().
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service: any = this.estacionamientoService as any;
        estacionamientos =
          (await service.listByCity?.(city)) ??
          (await this.estacionamientoService.list());
      } else {
        estacionamientos = await this.estacionamientoService.list();
      }
      // Formatear una respuesta de ejemplo.  En un futuro se puede
      // personalizar el mensaje con Gemini.
      return {
        reply: `Se encontraron ${estacionamientos.length} estacionamientos disponibles.`,
        data: estacionamientos,
      };
    } catch (err) {
      // Registrar el error y devolver un mensaje amigable.
      console.error("Error en handleFindParking", err);
      return {
        error: {
          message: "Ocurrió un error al buscar estacionamientos disponibles.",
        },
      };
    }
  }

  /**
   * Lógica para el intent CREATE_RESERVATION.  Crea una reserva a través
   * del servicio de Reservas utilizando los datos extraídos por Gemini.
   */
  private async handleCreateReservation(
    entities: Record<string, unknown>,
    user: AuthUserPayload
  ) {
    try {
      const { slotId, desde, hasta } = entities as {
        slotId: string;
        desde: string;
        hasta: string;
      };
      if (!slotId || !desde || !hasta) {
        return {
          error: {
            message:
              "Faltan datos para crear la reserva (slotId, desde, hasta).",
          },
        };
      }
      const dto: CreateReservaDto = {
        slot_id: slotId,
        desde: new Date(desde),
        hasta: new Date(hasta),
        precio_total: null,
        moneda: "ARS",
        origen: "chat",
      };
      const reserva: Reserva = await this.reservaService.create(user.id, dto);
      return {
        reply: `Tu reserva fue creada con éxito (ID: ${reserva.id}).`,
        data: reserva,
      };
    } catch (err) {
      console.error("Error en handleCreateReservation", err);
      return {
        error: {
          message:
            "No se pudo crear la reserva. Verifica los datos e intenta nuevamente.",
        },
      };
    }
  }

  /**
   * Llama a la API de Gemini para obtener el intent y las entidades
   * a partir del mensaje del usuario.  Utiliza la clave almacenada en
   * `env.ts` para autenticarse.  En caso de error, lanza una excepción
   * que será capturada por el método llamante.
   */
  private async callGemini(message: string): Promise<GeminiResponse> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "No se ha configurado GEMINI_API_KEY en el archivo env.ts"
      );
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          parts: [
            {
              text: `Eres un clasificador de intents para el dominio de parking.\nMensaje: ${message}`,
            },
          ],
        },
      ],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}`);
    }
    const json = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const raw = json.candidates?.[0]?.content.parts?.[0]?.text || "";
    // Suponemos que el modelo devuelve JSON con las claves intent y entities.
    let parsed: GeminiResponse;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(
        `Respuesta de Gemini no válida, se esperaba JSON: ${raw}`
      );
    }
    return parsed;
  }
}
