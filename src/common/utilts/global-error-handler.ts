import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public message: any,
    public statusCode: number = 500,
  ) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
  }
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(err.cause);
  res
    .status((err.cause as number) || 500)
    .json({ message: err.message, stack: err.stack });
};
