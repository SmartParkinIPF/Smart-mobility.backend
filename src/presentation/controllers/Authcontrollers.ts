import { Request, Response, NextFunction } from "express";
import { UserService } from "../../domain/services/UserServices";
import {
  loginSchema,
  registerSchema,
  logoutSchema,
} from "../../infra/validators/user.validator";
import { AppError } from "../../core/errors/AppError";

export class AuthController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const result = await this.userService.register(parsed);
      res.status(201).json(result);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.userService.login(parsed);
      res.json(result);
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = logoutSchema.parse(req.body);
      await this.userService.logout(refreshToken);
      res.status(200).json({ message: "Sesion cerrada" });
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  hola = async (_req: Request, res: Response) => {
    res.json({ message: "hola" });
  };

  private toAppError(err: unknown) {
    if ((err as any)?.issues)
      return new AppError("Validacion fallida", 400, (err as any).issues);
    return err as any;
  }
}
