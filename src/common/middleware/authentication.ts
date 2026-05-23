import type { Request, Response, NextFunction } from "express";
import { PREFIX, SECRET_KEY } from "../../config/config.service";
import { verifyToken } from "../utilts/token.service";
import UserRepository from "../../DB/repository/user.repository";
import { AppError } from "../utilts/global-error-handler";
import { IUser } from "../../DB/models/user.model";
import { HydratedDocument } from "mongoose";

const userServices = new UserRepository();

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
      decoded?: {
        id: string;
        jti: string;
        iat: number;
      };
    }
  }
}

type TDecoded = {
  id: string;
  jti: string;
  iat: number;
};

const validateToken = async (authorization: string) => {
  if (!authorization) {
    throw new AppError("token not exist");
  }

  const [prefix, token] = authorization.split(" ");

  if (!token || prefix !== PREFIX) {
    throw new AppError("Invalid token");
  }

  if (!SECRET_KEY) {
    throw new AppError("SECRET_KEY missing");
  }

  const decoded = verifyToken({
    token,
    secret_key: SECRET_KEY,
  }) as TDecoded;

  if (!decoded || typeof decoded === "string" || !("id" in decoded)) {
    throw new AppError("Invalid token");
  }

  const user = await userServices.findOne({
    filter: { _id: decoded.id },
  });

  if (!user) {
    throw new AppError("user not exist", 400);
  }

  if (
    user.changeCredential &&
    decoded.iat &&
    user.changeCredential.getTime() > decoded.iat * 1000
  ) {
    throw new AppError("token expired", 401);
  }

  return { user, decoded };
};

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;

  const { user, decoded } = await validateToken(authorization as string);

  req.user = user;
  req.decoded = decoded;

  next();
};

export const authentication_gql = async (authorization: string) => {
  return await validateToken(authorization);
};
