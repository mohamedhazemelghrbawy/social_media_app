import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import postModel, { IPost } from "../models/post.model";
import { AppError } from "../../common/utilts/global-error-handler";
import CommentModel, { IComment } from "../models/comment.model.js";

class CommentRepository extends BaseRepository<IComment> {
  constructor(protected readonly model: Model<IComment> = CommentModel) {
    super(model);
  }
  async checkComment(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("Email already exists", 400);
    }
  }
}

export default CommentRepository;
