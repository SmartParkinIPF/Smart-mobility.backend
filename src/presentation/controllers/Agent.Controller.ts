// Luca agregó esta parte del backend. quejarse con luca si hay algun problema

import { Request, Response } from "express";
import { AgentService, AuthUserPayload } from "../../domain/services/Agent.Service";

/**
 * Controlador HTTP para el agente.  Extrae el mensaje de la solicitud,
 * obtiene la identidad del usuario del objeto `req.user` (inyectado por
 * el middleware de autenticación) y delega en el AgentService.
 */
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Maneja la petición POST /api/agent.  Se asegura de que el cuerpo
   * contenga un campo `message` y que el usuario esté autenticado.  En
   * caso de cualquier error, envía una respuesta con status 400 o 500 y
   * un objeto de error.
   */
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body as { message?: string };
      const user = req.body.user as AuthUserPayload | undefined;
      if (!user) {
        res.status(401).json({ error: { message: "No autenticado" } });
        return;
      }
      if (!message) {
        res.status(400).json({ error: { message: "El campo message es requerido" } });
        return;
      }
      const result = await this.agentService.processUserMessage(message, user);
      res.json(result);
    } catch (err) {
      console.error("Error en AgentController", err);
      res.status(500).json({ error: { message: "Error interno del servidor" } });
    }
  }
}
