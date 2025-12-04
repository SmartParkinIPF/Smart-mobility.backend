import { Request, Response, NextFunction } from "express";
import { EncargadoService } from "../../domain/services/Encargado.Service";
import {
  createEncargadoSchema,
  updateEncargadoSchema,
} from "../../infra/validators/encargado.validator";
import { AppError } from "../../core/errors/AppError";

export class EncargadoController {
  constructor(private readonly service: EncargadoService) {}

  createOrAssign = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const provider = (req as any).authUser;
      if (!provider?.id) throw new AppError("No autenticado", 401);
      const establecimientoId = req.params.establecimientoId;
      const parsed = createEncargadoSchema.parse(req.body);

      const result = await this.service.createOrAssignEncargado(
        provider.id,
        establecimientoId,
        "existingUserId" in parsed && parsed.existingUserId
          ? { existingUserId: parsed.existingUserId }
          : {
              name: parsed.name!,
              lastName: parsed.lastName!,
              phone: parsed.phone!,
              email: parsed.email!,
              password: parsed.password!,
            }
      );

      res.status(201).json(result);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  getByEstablecimiento = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requester = (req as any).authUser;
      if (!requester?.id) throw new AppError("No autenticado", 401);
      const establecimientoId = req.params.establecimientoId;
      const encargado = await this.service.getEncargado(
        requester.id,
        establecimientoId
      );
      res.status(200).json({ encargado });
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = (req as any).authUser;
      if (!provider?.id) throw new AppError("No autenticado", 401);
      const encargadoId = req.params.encargadoId;
      const parsed = updateEncargadoSchema.parse(req.body);
      const updated = await this.service.updateEncargado(
        provider.id,
        encargadoId,
        {
          name: parsed.name,
          last_name: parsed.lastName,
          phone: parsed.phone,
        }
      );
      res.status(200).json({ encargado: updated });
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = (req as any).authUser;
      if (!provider?.id) throw new AppError("No autenticado", 401);
      const establecimientoId = req.params.establecimientoId;
      await this.service.removeEncargado(provider.id, establecimientoId);
      res.status(204).send();
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };
}
