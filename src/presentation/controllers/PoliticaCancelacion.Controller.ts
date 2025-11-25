import { Request, Response, NextFunction } from "express";
import { PoliticaCancelacionService } from "../../domain/services/PoliticaCancelacion.Service";
import {
  createPoliticaCancelacionSchema,
  updatePoliticaCancelacionSchema,
} from "../../infra/validators/politica-cancelacion.validator";
import { AppError } from "../../core/errors/AppError";

export class PoliticaCancelacionController {
  constructor(private readonly service: PoliticaCancelacionService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createPoliticaCancelacionSchema.parse(req.body);
      const authUser = (req as any)?.authUser;
      const createdBy = authUser?.id ?? parsed.created_by ?? null;
      const created = await this.service.create(
        { ...parsed, created_by: createdBy },
        createdBy
      );
      res.status(201).json(created);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.service.findById(id);
      res.status(200).json(item);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.list();
      res.status(200).json(items);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  listByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = (req as any)?.authUser;
      if (!authUser) throw new AppError("No autenticado", 401);
      const paramId = req.params.userId;
      const requestedId = (paramId ?? authUser.id)?.toString();
      console.log("awdaawd", requestedId);
      if (!requestedId) throw new AppError("Usuario inválido", 400);
      const isSameUser = authUser.id?.toString() === requestedId;
      if (!isSameUser && !this.isAdmin(authUser)) {
        throw new AppError("No autorizado", 403);
      }
      const items = await this.service.listByUser(requestedId);
      res.status(200).json(items);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updatePoliticaCancelacionSchema.parse(req.body);
      const authUser = (req as any)?.authUser;
      const existing = await this.service.findById(id);
      if (!existing) throw new AppError("Política no encontrada", 404);
      const isAdmin = this.isAdmin(authUser);
      const authId = authUser?.id?.toString();
      const ownerId = existing.created_by ?? null;
      const sameOwner =
        ownerId !== null && authId && ownerId.toString() === authId;
      if (!isAdmin && !sameOwner) {
        throw new AppError("No autorizado para modificar esta política", 403);
      }
      const payload = { ...parsed };
      delete (payload as any).created_by;
      const updated = await this.service.update(id, payload);
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authUser = (req as any)?.authUser;
      const existing = await this.service.findById(id);
      if (!existing) throw new AppError("Política no encontrada", 404);
      const isAdmin = this.isAdmin(authUser);
      const authId = authUser?.id?.toString();
      const ownerId = existing.created_by ?? null;
      const sameOwner =
        ownerId !== null && authId && ownerId.toString() === authId;
      if (!isAdmin && !sameOwner) {
        throw new AppError("No autorizado para eliminar esta política", 403);
      }
      await this.service.delete(id);
      res.status(204).send();
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  private toAppError(err: unknown) {
    if ((err as any)?.issues)
      return new AppError("Validación fallida", 400, (err as any).issues);
    return err as any;
  }

  private isAdmin(user: any): boolean {
    if (!user) return false;
    const candidates = [
      user.rol_id,
      user.rolId,
      user.role,
      user.role_id,
      user.roleId,
      user.roleID,
    ];
    return candidates
      .filter((c) => c != null)
      .map((c) => String(c).toLowerCase().trim())
      .some((v) => v === "admin" || v === "administrador" || v === "1");
  }
}
