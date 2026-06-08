"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_repository_1 = __importDefault(require("./base.repository"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
const global_error_handler_1 = require("../../common/utilts/global-error-handler");
class ChatRepository extends base_repository_1.default {
    model;
    constructor(model = chat_model_1.default) {
        super(model);
        this.model = model;
    }
    async checkchat(email) {
        const emailExist = await this.model.findOne({ email });
        if (emailExist) {
            throw new global_error_handler_1.AppError("Email already exists", 400);
        }
    }
}
exports.default = ChatRepository;
