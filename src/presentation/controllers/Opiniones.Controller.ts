import { Request, Response, NextFunction } from "express";
import { OpinionService } from "../../domain/services/Opinion.Service";
import { createOpinionSchema, updateOpinionSchema } from "../../infra/validators/opinion.validator";
import { AppError } from "../../core/errors/AppError";

export class OpinionesController {
  constructor(private readonly service: OpinionService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const parsed = createOpinionSchema.parse(req.body);
      const created = await this.service.create(user.id, parsed);
      res.status(201).json(created);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const opinion = await this.service.getById(id);
      res.status(200).json(opinion);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  listByEstablecimiento = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { establecimientoId } = req.params;
      const opiniones = await this.service.listByEstablecimiento(establecimientoId);
      res.status(200).json(opiniones);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const establecimientoId = (req.query.establecimiento_id as string | undefined) || undefined;
      const opiniones = await this.service.listByUsuario(user.id, establecimientoId);
      res.status(200).json(opiniones);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  updateOwn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      const parsed = updateOpinionSchema.parse(req.body);
      const updated = await this.service.updateOwn(id, user.id, parsed);
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  deleteOwn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).authUser;
      if (!user?.id) throw new AppError("No autenticado", 401);
      const { id } = req.params;
      await this.service.deleteOwn(id, user.id);
      res.status(204).send();
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  private toAppError(err: unknown) {
    if ((err as any)?.issues)
      return new AppError("Validacion fallida", 400, (err as any).issues);
    return err as any;
  }
}
