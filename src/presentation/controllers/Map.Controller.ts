import { Request, Response, NextFunction } from "express";
import { MapMarkerService } from "../../domain/services/MapMarker.Service";
import { createMarkerSchema } from "../../infra/validators/mapMarker.validator";
import { AppError } from "../../core/errors/AppError";

export class MapController {
  constructor(private readonly mapService: MapMarkerService) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.mapService.list();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createMarkerSchema.parse(req.body);
      const data = await this.mapService.create(parsed);
      res.status(201).json(data);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validación fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };
}
