"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_repository_1 = __importDefault(require("./base.repository"));
const user_model_1 = __importDefault(require("../../DB/models/user.model"));
class UserRepository extends base_repository_1.default {
    model;
    constructor(model = user_model_1.default) {
        super(model);
        this.model = model;
    }
}
exports.default = UserRepository;
