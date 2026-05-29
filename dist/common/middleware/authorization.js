"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization_gql = exports.authorization = void 0;
const global_error_handler_js_1 = require("../utilts/global-error-handler.js");
const authorization = (role = []) => {
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            throw new global_error_handler_js_1.AppError("You  are not have access");
        }
        next();
    };
};
exports.authorization = authorization;
const authorization_gql = (roles, role) => {
    if (!roles.includes(role)) {
        throw new global_error_handler_js_1.AppError("UnAuthorized");
    }
};
exports.authorization_gql = authorization_gql;
