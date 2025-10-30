import { Request, Response, NextFunction } from "express";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import {
  createEstablecimientoSchema,
  updateEstablecimientoSchema,
} from "../../infra/validators/establecimiento.validator";
import { AppError } from "../../core/errors/AppError";

export class EstablecimientoController {
  constructor(private readonly service: EstablecimientoService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createEstablecimientoSchema.parse(req.body);
      const created = await this.service.create(parsed);
      res.status(201).json(created);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.list();
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const item = await this.service.getById(id);
      if (!item) return res.status(404).json({ message: "No encontrado" });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const parsed = updateEstablecimientoSchema.parse(req.body);
      const item = await this.service.update(id, parsed as any);
      res.json(item);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.service.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
