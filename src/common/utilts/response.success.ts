import type { Request, Response, NextFunction } from "express";

interface ISuccessResponse {
  res: Response;
  status?: number;
  message?: string;
  data?: unknown;
}

export const successResponse = ({
  res,
  status = 200,
  message = "done",
  data = undefined,
}: ISuccessResponse) => {
  return res.status(status).json({ message, data });
};
