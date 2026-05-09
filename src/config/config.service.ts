import { resolve } from "path";
import { config } from "dotenv";

import dotenv from "dotenv";
const NODE_ENV = process.env.NODE_ENV;

config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT: number = Number(process.env.PORT) || 7000;

export const MONGO_URI: string = process.env.MONGO_URI!;

export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

export const SECRET_KEY = process.env.SECRET_KEY;

export const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

export const EMAIL = process.env.EMAIL;

export const PASSWORD = process.env.PASSWORD;

export const REDIS_URL = process.env.REDIS_URL;

export const PREFIX = process.env.PREFIX;

// export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export const AWS_REGION = process.env.AWS_REGION;

export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;

export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
