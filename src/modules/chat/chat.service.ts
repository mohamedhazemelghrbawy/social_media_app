import { Server, Socket } from "socket.io";
import { Request, Response } from "express";
import UserRepository from "../../DB/repository/user.repository.js";
import { AppError } from "../../common/utilts/global-error-handler.js";
import ChatRepository from "../../DB/repository/chat.repository.js";
import { successResponse } from "../../common/utilts/response.success.js";
import { log } from "console";
import redisService from "../../common/services/redis.service.js";
class ChatService {
  private readonly _userRepo = new UserRepository();

  private readonly _chatRepo = new ChatRepository();

  constructor() {}

  //rest api
  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params as any;

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
        participants: [req.user!._id, userId],
        createdBy: req.user!._id,
        messages: [],
      });
    }

    successResponse({
      res,
      message: "Done",
      data: chat,
    });
  };
  // socket
  // sayHi = async (data: any) => {
  //   console.log(data);
  // };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;
    const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
    if (!user) throw new AppError("user not exist");

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

    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });
    io.to(await redisService.getSockets(sendTo)).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
}

export default new ChatService();
