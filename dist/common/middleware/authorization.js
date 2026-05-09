"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const authorization = (role = []) => {
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            throw new Error("You  are not have access");
        }
        next();
    };
};
exports.authorization = authorization;
