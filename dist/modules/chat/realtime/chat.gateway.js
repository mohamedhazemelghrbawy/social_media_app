"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_evernt_js_1 = __importDefault(require("./chat.evernt.js"));
class ChatGateway {
    constructor() { }
    async registerEvents(socket, io) {
        // chatEvernt.hi(socket);
        chat_evernt_js_1.default.sendMessage(socket, io);
    }
}
exports.default = new ChatGateway();
