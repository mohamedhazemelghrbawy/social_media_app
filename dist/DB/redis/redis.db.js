"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = exports.redisClient = void 0;
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({
    url: "rediss://default:gQAAAAAAAQzPAAIncDI3ZGQzNjI0MDRkODM0MWRmOGNlODMwNTg4YTgzNjFjMHAyNjg4MTU@mighty-bird-68815.upstash.io:6379",
});
const redisConnection = async () => {
    try {
        await exports.redisClient.connect();
        console.log("success to connect with redis");
    }
    catch (error) {
        console.log("Fail to connect with redis", error);
    }
};
exports.redisConnection = redisConnection;
