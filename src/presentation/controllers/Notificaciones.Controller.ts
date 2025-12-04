import { Request, Response, NextFunction } from "express";
import { NotificacionService } from "../../domain/services/Notificacion.Service";
import { NotificacionSupabaseRepository } from "../../infra/repositories/NotificacionRepository";
import { AppError } from "../../core/errors/AppError";

export class NotificacionesController {
  private service = new NotificacionService(new NotificacionSupabaseRepository());

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const items = await this.service.listar(user.id, 50);
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  };

  markLeida = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      const updated = await this.service.marcarLeida(id);
      if (updated.user_id !== user.id) throw new AppError("No autorizado", 403);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };
}
