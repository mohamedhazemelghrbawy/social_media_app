import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import chatModel, { IChat } from "../models/chat.model";
import { AppError } from "../../common/utilts/global-error-handler";

class ChatRepository extends BaseRepository<IChat> {
  constructor(protected readonly model: Model<IChat> = chatModel) {
    super(model);
  }
  async checkchat(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("Email already exists", 400);
    }
  }
}

export default ChatRepository;
