import jwt, { SignOptions, VerifyOptions, JwtPayload } from "jsonwebtoken";

interface IGenerateToken {
  payload?: string | object | Buffer;
  secret_key: string;
  options?: SignOptions;
}

export const generateToken = ({
  payload = {},
  secret_key,
  options = {},
}: IGenerateToken): string => {
  return jwt.sign(payload, secret_key, options);
};

interface IVerifyToken {
  token: string;
  secret_key: string;
  options?: VerifyOptions;
}

export const verifyToken = ({
  token,
  secret_key,
  options = {},
}: IVerifyToken): JwtPayload | string => {
  return jwt.verify(token, secret_key, options);
};
