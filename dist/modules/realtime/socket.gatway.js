"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const chat_gateway_js_1 = __importDefault(require("../chat/realtime/chat.gateway.js"));
const authentication_js_1 = require("../../common/middleware/authentication.js");
const redis_service_js_1 = __importDefault(require("../../common/services/redis.service.js"));
class SocketGateway {
    constructor() { }
    initIo = async (httpServer) => {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
            },
        });
        io.use(async (socket, next) => {
            // console.log("middleware entered");
            // console.log(socket.handshake.auth);
            try {
                const token = socket.handshake.auth.authorization ||
                    socket.handshake.headers.authorization;
                console.log("TOKEN =", token);
                const { user } = await (0, authentication_js_1.decodeToken_and_fetchUser)(token);
                // console.log("USER =", user._id);
                socket.data.user = user;
                // console.log("USER FROM API:", { user });
                // console.log("FRIENDS:", user.friends);
                next();
            }
            catch (error) {
                console.log("AUTH ERROR =", error);
                next(error);
            }
        });
        io.on("connection", async (socket) => {
            console.log("CONNECTED", socket.id);
            await redis_service_js_1.default.addSocket({
                userId: socket.data.user._id,
                SocketId: socket.id,
            });
            await chat_gateway_js_1.default.registerEvents(socket, io);
            console.log({
                useSocketsIds: await redis_service_js_1.default.getSockets(socket.data.user._id),
            });
            socket.on("disconnect", async () => {
                await redis_service_js_1.default.removeSocket({
                    userId: socket.data.user._id,
                    SocketId: socket.id,
                });
                console.log({
                    useSocketsIdsAfterDisconnect: await redis_service_js_1.default.getSockets(socket.data.user._id),
                });
            });
        });
    };
}
exports.default = new SocketGateway();
