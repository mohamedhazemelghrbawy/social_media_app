import { Types } from "mongoose";
import { AppError } from "../utilts/global-error-handler";
// import { redisClient } from "../../DB/redis/redis.db";
import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service";

interface IUserKey {
  userId: Types.ObjectId;
  jti?: string;
}

interface IOtpKey {
  email: string;
  type: string;
}

interface IValue {
  key: string;
  value?: unknown;
  ttl?: number;
}

class RedisService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({
      url: REDIS_URL!,
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("success to connect with redis");
    } catch (error) {
      console.log("Fail to connect with redis", error);
    }
  }
  revoked_key({ userId, jti }: IUserKey) {
    return `revoke_token::${userId}::${jti}`;
  }
  get_key({ userId }: IUserKey) {
    return `revoke_token::${userId}`;
  }
  otp_key({ email, type }: IOtpKey) {
    return `${type}::${email}`;
  }
  max_otp_key({ email, type }: IOtpKey) {
    return `${type}::${email}::max_tries`;
  }
  block_otp_key({ email, type }: IOtpKey) {
    return `${type}::${email}::block`;
  }
  max_password_key({ email }: { email: string }) {
    return `password::${email}::max_tries`;
  }
  block_password_key({ email }: { email: string }) {
    return `password::${email}::block`;
  }

  async setValue({ key, value, ttl }: IValue) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      throw new AppError("error to set data in redis", 500);
    }
  }
  async update({ key, value }: IValue) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      if (!(await this.client.exists(key))) {
        return 0;
      }
      return await this.client.set(key, data);
    } catch (error) {
      throw new AppError("error to update data in redis", 500);
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.client.get(key);

      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      throw new AppError("error to get data in redis", 500);
    }
  }
  async ttlTimer(key: string) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      throw new AppError("error to get ttl data in redis", 500);
    }
  }
  async expire(key: string, ttl: number) {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      throw new AppError("error to get expire data in redis");
    }
  }

  async exists(key: string): Promise<any> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      throw new AppError("error to exist data in redis");
    }
  }

  async deleteKey(key: string) {
    try {
      if (!key) return 0;
      return await this.client.del(key);
    } catch (error) {
      throw new AppError("error to delete data in redis");
    }
  }

  async keys(pattern = "*") {
    try {
      return await this.client.keys(`${pattern}`);
    } catch (error) {
      throw new AppError("error to get keys from redis");
    }
  }

  async incr(key: string) {
    try {
      if (!key) {
        return 0;
      }
      return await this.client.incr(key);
    } catch (error) {
      throw new AppError("error to increment operation");
    }
  }

  key(userId: Types.ObjectId) {
    return `user:FCM:${userId}`;
  }

  async addFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sAdd(this.key(userId), FCMToken);
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sRem(this.key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId) {
    return await this.client.sMembers(this.key(userId));
  }

  async hasFCMs(userId: Types.ObjectId) {
    return await this.client.sCard(this.key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId) {
    return await this.client.del(this.key(userId));
  }
}

export default new RedisService();
