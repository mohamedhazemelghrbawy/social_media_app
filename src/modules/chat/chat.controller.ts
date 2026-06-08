import { Router } from "express";
import postService from "./chat.service";
import chatService from "./chat.service";

const chatRouter = Router({ mergeParams: true });

chatRouter.get("/", chatService.getChat);

export default chatRouter;
