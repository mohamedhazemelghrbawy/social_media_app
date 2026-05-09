"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handler_1 = require("../../common/utilts/global-error-handler");
const redis_db_1 = require("./redis.db");
class RedisService {
    revoked_key({ userId, jti }) {
        return `revoke_token::${userId}::${jti}`;
    }
    get_key({ userId }) {
        return `revoke_token::${userId}`;
    }
    otp_key({ email, type }) {
        return `${type}::${email}`;
    }
    max_otp_key({ email, type }) {
        return `${type}::${email}::max_tries`;
    }
    block_otp_key({ email, type }) {
        return `${type}::${email}::block`;
    }
    max_password_key({ email }) {
        return `password::${email}::max_tries`;
    }
    block_password_key({ email }) {
        return `password::${email}::block`;
    }
    async setValue({ key, value, ttl }) {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl
                ? await redis_db_1.redisClient.set(key, data, { EX: ttl })
                : await redis_db_1.redisClient.set(key, data);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to set data in redis", 500);
        }
    }
    async update({ key, value }) {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (!(await redis_db_1.redisClient.exists(key))) {
                return 0;
            }
            return await redis_db_1.redisClient.set(key, data);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to update data in redis", 500);
        }
    }
    async get(key) {
        try {
            const data = await redis_db_1.redisClient.get(key);
            if (!data)
                return null;
            try {
                return JSON.parse(data);
            }
            catch {
                return data;
            }
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get data in redis", 500);
        }
    }
    async ttlTimer(key) {
        try {
            return await redis_db_1.redisClient.ttl(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get ttl data in redis", 500);
        }
    }
    async expire(key, ttl) {
        try {
            return await redis_db_1.redisClient.expire(key, ttl);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get expire data in redis");
        }
    }
    async exists(key) {
        try {
            return await redis_db_1.redisClient.exists(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to exist data in redis");
        }
    }
    async deleteKey(key) {
        try {
            if (!key)
                return 0;
            return await redis_db_1.redisClient.del(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to delete data in redis");
        }
    }
    async keys(pattern = "*") {
        try {
            return await redis_db_1.redisClient.keys(`${pattern}`);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get keys from redis");
        }
    }
    async incr(key) {
        try {
            if (!key) {
                return 0;
            }
            return await redis_db_1.redisClient.incr(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to increment operation");
        }
    }
}
exports.default = new RedisService();
