"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = ({ payload = {}, secret_key, options = {}, }) => {
    return jsonwebtoken_1.default.sign(payload, secret_key, options);
};
exports.generateToken = generateToken;
const verifyToken = ({ token, secret_key, options = {}, }) => {
    return jsonwebtoken_1.default.verify(token, secret_key, options);
};
exports.verifyToken = verifyToken;
