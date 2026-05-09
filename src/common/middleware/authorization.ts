import type { Request, Response, NextFunction } from "express";
import { RoleEnum } from "../enum/user.enum";

export const authorization = (role: RoleEnum[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!role.includes((req as any).user.role)) {
      throw new Error("You  are not have access");
    }
    next();
  };
};
