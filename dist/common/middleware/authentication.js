"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication_gql = exports.authentication = exports.decodeToken_and_fetchUser = void 0;
const config_service_1 = require("../../config/config.service");
const token_service_1 = require("../utilts/token.service");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const global_error_handler_1 = require("../utilts/global-error-handler");
const userServices = new user_repository_1.default();
const decodeToken_and_fetchUser = async (authorization) => {
    console.log("AUTH INPUT:", authorization);
    if (!authorization || authorization == null) {
        throw new global_error_handler_1.AppError("token not exist");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token || prefix !== config_service_1.PREFIX) {
        throw new global_error_handler_1.AppError("Invalid token");
    }
    if (!config_service_1.SECRET_KEY) {
        throw new global_error_handler_1.AppError("SECRET_KEY missing");
    }
    const decoded = (0, token_service_1.verifyToken)({
        token,
        secret_key: config_service_1.SECRET_KEY,
    });
    if (!decoded || typeof decoded === "string" || !("id" in decoded)) {
        throw new global_error_handler_1.AppError("Invalid token");
    }
    const user = await userServices.findOne({
        filter: { _id: decoded.id },
    });
    if (!user) {
        throw new global_error_handler_1.AppError("user not exist", 400);
    }
    if (user.changeCredential &&
        decoded.iat &&
        user.changeCredential.getTime() > decoded.iat * 1000) {
        throw new global_error_handler_1.AppError("token expired", 401);
    }
    return { user, decoded };
};
exports.decodeToken_and_fetchUser = decodeToken_and_fetchUser;
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    const { user, decoded } = await (0, exports.decodeToken_and_fetchUser)(authorization);
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
const authentication_gql = async (authorization) => {
    return await (0, exports.decodeToken_and_fetchUser)(authorization);
};
exports.authentication_gql = authentication_gql;
