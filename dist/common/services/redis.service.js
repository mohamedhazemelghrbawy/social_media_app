"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handler_1 = require("../utilts/global-error-handler");
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL,
        });
    }
    async connect() {
        try {
            await this.client.connect();
            console.log("success to connect with redis");
        }
        catch (error) {
            console.log("Fail to connect with redis", error);
        }
    }
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
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to set data in redis", 500);
        }
    }
    async update({ key, value }) {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (!(await this.client.exists(key))) {
                return 0;
            }
            return await this.client.set(key, data);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to update data in redis", 500);
        }
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
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
            return await this.client.ttl(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get ttl data in redis", 500);
        }
    }
    async expire(key, ttl) {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to get expire data in redis");
        }
    }
    async exists(key) {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to exist data in redis");
        }
    }
    async deleteKey(key) {
        try {
            if (!key)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to delete data in redis");
        }
    }
    async keys(pattern = "*") {
        try {
            return await this.client.keys(`${pattern}`);
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
            return await this.client.incr(key);
        }
        catch (error) {
            throw new global_error_handler_1.AppError("error to increment operation");
        }
    }
    key(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM({ userId, FCMToken, }) {
        return await this.client.sAdd(this.key(userId), FCMToken);
    }
    async removeFCM({ userId, FCMToken, }) {
        return await this.client.sRem(this.key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.key(userId));
    }
}
exports.default = new RedisService();
