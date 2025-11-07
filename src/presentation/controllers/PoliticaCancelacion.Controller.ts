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
      const created = await this.service.create(parsed);
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

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updatePoliticaCancelacionSchema.parse(req.body);
      const updated = await this.service.update(id, parsed);
      res.status(200).json(updated);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
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
}

