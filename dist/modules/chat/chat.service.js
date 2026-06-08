"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_js_1 = __importDefault(require("../../DB/repository/user.repository.js"));
const global_error_handler_js_1 = require("../../common/utilts/global-error-handler.js");
const chat_repository_js_1 = __importDefault(require("../../DB/repository/chat.repository.js"));
const response_success_js_1 = require("../../common/utilts/response.success.js");
const redis_service_js_1 = __importDefault(require("../../common/services/redis.service.js"));
class ChatService {
    _userRepo = new user_repository_js_1.default();
    _chatRepo = new chat_repository_js_1.default();
    constructor() { }
    //rest api
    getChat = async (req, res) => {
        const { userId } = req.params;
        let chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId],
                },
                group: { $exists: false },
            },
            options: {
                populate: [
                    {
                        path: "participants",
                    },
                ],
            },
        });
        console.log("chat:", { chat });
        if (!chat) {
            chat = await this._chatRepo.create({
                participants: [req.user._id, userId],
                createdBy: req.user._id,
                messages: [],
            });
        }
        (0, response_success_js_1.successResponse)({
            res,
            message: "Done",
            data: chat,
        });
    };
    // socket
    // sayHi = async (data: any) => {
    //   console.log(data);
    // };
    sendMessage = async (data, socket, io) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
        if (!user)
            throw new global_error_handler_js_1.AppError("user not exist");
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: { $all: [sendTo, createdBy] },
                group: { $exists: false },
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy,
                    },
                },
            },
        });
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [
                    {
                        content,
                        createdBy,
                    },
                ],
                participants: [sendTo, createdBy],
            });
        }
        io.to(await redis_service_js_1.default.getSockets(createdBy)).emit("successMessage", {
            content,
        });
        io.to(await redis_service_js_1.default.getSockets(sendTo)).emit("newMessage", {
            content,
            from: socket.data.user,
        });
    };
}
exports.default = new ChatService();
