"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.message = message;
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const globalErrorHandler = (err, req, res, next) => {
    console.log(err.cause);
    res
        .status(err.cause || 500)
        .json({ message: err.message, stack: err.stack });
};
exports.globalErrorHandler = globalErrorHandler;
