import type { Request, Response, NextFunction } from "express";
import { RoleEnum } from "../enum/user.enum";
import { AppError } from "../utilts/global-error-handler.js";

export const authorization = (role: RoleEnum[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!role.includes((req as any).user.role)) {
      throw new AppError("You  are not have access");
    }
    next();
  };
};

export const authorization_gql = (roles: string[], role: string) => {
  if (!roles.includes(role)) {
    throw new AppError("UnAuthorized");
  }
};
