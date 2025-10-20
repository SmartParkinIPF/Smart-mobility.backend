import { Request, Response, NextFunction } from "express";
import { RoleService } from "../../domain/services/Role.Service";
import { UserService } from "../../domain/services/User.Service";
import { assignRoleSchema } from "../../infra/validators/role.validator";
import {
  updateUserSchema,
  deleteUserSchema,
} from "../../infra/validators/user.validator";
import { AppError } from "../../core/errors/AppError";

export class UsersController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService
  ) {}

  assignRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.userId;
      const { currentUserId, role } = assignRoleSchema.parse(req.body);

      const updated = await this.roleService.assignRole(
        currentUserId,
        targetUserId,
        role
      );

      res.json({ user: updated });
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validaci�n fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.userId;
      const parsed = updateUserSchema.parse(req.body);

      const user = await this.userService.updateProfile(
        parsed.requesterId,
        targetUserId,
        {
          name: parsed.name,
          lastName: parsed.lastName,
          phone: parsed.phone,
        }
      );

      res.json({ user });
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validaci�n fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.userId;
      const { requesterId } = deleteUserSchema.parse(req.body);

      await this.userService.deleteAccount(requesterId, targetUserId);
      res.status(204).send();
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validaci�n fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };
}
