export class AppError extends Error {
  constructor(
    public message: string,
    public status = 400,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
