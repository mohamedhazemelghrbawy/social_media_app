"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_service_js_1 = __importDefault(require("../chat.service.js"));
class ChatEvent {
    constructor() { }
    // hi = async (socket: Socket) => {
    //   socket.on("hi", (data: any) => {
    //     chatService.sayHi(data);
    //   });
    // };
    sendMessage = async (socket, io) => {
        socket.on("sendMessage", (data) => {
            chat_service_js_1.default.sendMessage(data, socket, io);
        });
    };
}
exports.default = new ChatEvent();
