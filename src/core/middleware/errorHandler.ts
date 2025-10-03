import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../http/HttpStatus";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: err.message, details: err.details });
  }
  console.error(err);
  return res
    .status(HttpStatus.INTERNAL)
    .json({ error: "Internal Server Error" });
}
