import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import postModel, { IPost } from "../models/post.model";
import { AppError } from "../../common/utilts/global-error-handler";

class PostRepository extends BaseRepository<IPost> {
  constructor(protected readonly model: Model<IPost> = postModel) {
    super(model);
  }
  async checkPost(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("Email already exists", 400);
    }
  }
}

export default PostRepository;
