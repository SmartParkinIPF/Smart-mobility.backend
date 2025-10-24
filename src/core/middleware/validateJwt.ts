import jwt, { type JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../http/HttpStatus";
import { ENV } from "../../config/env";

type Decoded = JwtPayload & { sub?: number; userId?: number };

export class ValidatorJwt {
  private user = new AuthUserRepository();

  constructor() {}

  async createJwt(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const payload = { sub: userId };
        jwt.sign(
          payload,
          ENV.JWT_SECRET!,
          { expiresIn: "1h" },
          (err, token) => {
            if (err || !token) return reject("No se pudo generar el token");
            resolve(token);
          }
        );
      } catch (error) {
        reject("No se pudo generar el token");
      }
    });
  }

  validateJwt = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let token: string | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token && (req as any).cookies && (req as any).cookies.token) {
        token = (req as any).cookies.token as string;
      }

      if (!token) {
        return next(new AppError("No se encontró el token", HttpStatus.UNAUTHORIZED));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET!) as Decoded;
      const userId = decoded.sub;
      if (!userId) {
        return next(new AppError("Token inválido", HttpStatus.UNAUTHORIZED));
      }

      const user = await this.user.findById(userId);
      if (!user) {
        return next(new AppError("Usuario no encontrado", HttpStatus.UNAUTHORIZED));
      }

      (req as any).authUser = user;
      (req as any).authToken = token;
      return next();
    } catch (error: any) {
      if (error?.name === "TokenExpiredError")
        return next(new AppError("Token expirado", HttpStatus.UNAUTHORIZED));
      if (error?.name === "JsonWebTokenError")
        return next(new AppError("Token inválido", HttpStatus.UNAUTHORIZED));
      return next(error);
    }
  };
}

