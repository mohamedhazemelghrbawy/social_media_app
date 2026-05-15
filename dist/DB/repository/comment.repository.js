"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_repository_1 = __importDefault(require("./base.repository"));
const global_error_handler_1 = require("../../common/utilts/global-error-handler");
const comment_model_js_1 = __importDefault(require("../models/comment.model.js"));
class CommentRepository extends base_repository_1.default {
    model;
    constructor(model = comment_model_js_1.default) {
        super(model);
        this.model = model;
    }
    async checkComment(email) {
        const emailExist = await this.model.findOne({ email });
        if (emailExist) {
            throw new global_error_handler_1.AppError("Email already exists", 400);
        }
    }
}
exports.default = CommentRepository;
