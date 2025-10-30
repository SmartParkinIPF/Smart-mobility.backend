import { Request, Response, NextFunction } from "express";

function normalize(val: unknown): string {
  return String(val ?? "").toLowerCase().trim();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).authUser as { role?: string } | undefined;
  if (!user) return next(new Error("No autorizado"));
  const role = normalize(user.role);
  const allowed = (process.env.ADMIN_ROLES || "admin,1")
    .split(",")
    .map((s) => normalize(s));
  if (!allowed.includes(role)) return next(new Error("Solo administradores"));
  return next();
}
