import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import StoryModel, { IStory } from "../models/story.model";
import { AppError } from "../../common/utilts/global-error-handler";

class StoryRepository extends BaseRepository<IStory> {
  constructor(protected readonly model: Model<IStory> = StoryModel) {
    super(model);
  }
  async checkStory(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("Email already exists", 400);
    }
  }
}

export default StoryRepository;
