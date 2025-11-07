import { Request, Response, NextFunction } from "express";
import { EstacionamientoService } from "../../domain/services/Estacionamiento.Service";
import {
  createEstacionamientoSchema,
  updateEstacionamientoSchema,
} from "../../infra/validators/estacionamiento.validator";
import { AppError } from "../../core/errors/AppError";

export class EstacionamientoController {
  constructor(private readonly service: EstacionamientoService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createEstacionamientoSchema.parse(req.body);
      console.log(parsed);
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

  listByEstablecimiento = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const establecimientoId = req.params.establecimientoId;
      const items = await this.service.listByEstablecimiento(establecimientoId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const parsed = updateEstacionamientoSchema.parse(req.body);
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
