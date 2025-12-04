import { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import { AlertaService } from "../../domain/services/Alerta.Service";
import { AlertasRepository } from "../../infra/repositories/AlertaRepository";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";

type SSEClient = { res: Response; establecimientoId: string };
const sseClients = new Set<SSEClient>();

function broadcast(establecimientoId: string, payload: any) {
  for (const client of Array.from(sseClients)) {
    if (client.establecimientoId !== establecimientoId) continue;
    try {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // drop broken clients
      try {
        client.res.end();
      } catch {}
      sseClients.delete(client);
    }
  }
}

export class AlertasController {
  private slotRepo = new SlotsSupabaseRepository();
  private service = new AlertaService(
    new AlertasRepository(),
    new SlotsSupabaseRepository(),
    new EstacionamientoSupabaseRepository(),
    new UsersRepository()
  );

  private async withSlotCodigo(alerta: any) {
    try {
      const slot = await this.slotRepo.findById(alerta.slot_id);
      return { ...alerta, slot_codigo: (slot as any)?.codigo ?? null };
    } catch {
      return alerta;
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { slot_id, mensaje } = req.body || {};
      if (!slot_id || typeof slot_id !== "string")
        throw new AppError("slot_id requerido", 400);
      const alertaRaw = await this.service.crear(user.id, {
        slot_id,
        mensaje: mensaje ?? null,
      });
      const alerta = await this.withSlotCodigo(alertaRaw);
      broadcast(alerta.establecimiento_id, { type: "created", alerta });
      res.status(201).json(alerta);
    } catch (err) {
      next(err);
    }
  };

  listForEncargado = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const estado = (req.query.estado as string) || undefined;
      const alertas = await this.service.listarPorEncargado(user.id, estado);
      const enriched = await Promise.all(alertas.map((a) => this.withSlotCodigo(a)));
      res.status(200).json(enriched);
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      const alertaRaw = await this.service.marcarLeida(user.id, id);
      const alerta = await this.withSlotCodigo(alertaRaw);
      broadcast(alerta.establecimiento_id, { type: "updated", alerta });
      res.status(200).json(alerta);
    } catch (err) {
      next(err);
    }
  };

  updateEstado = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      const { estado } = req.body || {};
      if (!estado || typeof estado !== "string")
        throw new AppError("estado requerido", 400);
      const alertaRaw = await this.service.actualizarEstado(user.id, id, estado);
      const alerta = await this.withSlotCodigo(alertaRaw);
      broadcast(alerta.establecimiento_id, { type: "updated", alerta });
      res.status(200).json(alerta);
    } catch (err) {
      next(err);
    }
  };

  streamForEncargado = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      // reuse service guard to ensure role & establishment
      const latest = await this.service.listarPorEncargado(user.id, undefined, 1);
      const establecimientoId = latest[0]?.establecimiento_id ?? null;
      // If no alerts yet, we still need the establishment_id; fetch from user
      const usersRepo = new UsersRepository();
      const full = await usersRepo.findById(user.id);
      const estId = full?.establecimiento_id ?? establecimientoId;
      if (!estId) throw new AppError("Encargado sin establecimiento asignado", 400);

      res.set({
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
      });
      res.flushHeaders();
      res.write("retry: 3000\n\n");

      const client: SSEClient = { res, establecimientoId: estId };
      sseClients.add(client);

      req.on("close", () => {
        sseClients.delete(client);
      });
    } catch (err) {
      next(err);
    }
  };

  resolver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      const alertaRaw = await this.service.resolver(user.id, id);
      const alerta = await this.withSlotCodigo(alertaRaw);
      broadcast(alerta.establecimiento_id, { type: "updated", alerta });
      res.status(200).json(alerta);
    } catch (err) {
      next(err);
    }
  };
}
