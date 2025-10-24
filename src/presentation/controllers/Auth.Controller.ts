import { Request, Response, NextFunction } from "express";
import { UserService } from "../../domain/services/User.Service";
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
      console.log(parsed);

      const result = await this.userService.register(parsed);
      res.status(201).json(result);
    } catch (err) {
      console.log(err);
      next(this.toAppError(err));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const { token } = await this.userService.login(parsed);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
      });
      res.status(201).json({ message: "Session iniciada correctamente" });
    } catch (err) {
      next(this.toAppError(err));
    }
  };

  session = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = (req as any).authUser;
      const authToken = (req as any).authToken;

      console.log("user:", authUser, "token:", authToken);
      if (!authToken || !authUser) {
        return res.status(401).json({ message: "No hay session activa" });
      }

      return res.status(200).json({
        token: authToken,
        user: {
          email: authUser.email,
          rol_id: authUser.role,
        },
      });
    } catch (error) {
      next(this.toAppError(error));
    }
  };
  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("token");
      res.status(200).json({ message: "Sesion cerrada" });
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
