import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import userModel, { IUser } from "../models/user.model";
import { AppError } from "../../common/utilts/global-error-handler";

class UserRepository extends BaseRepository<IUser> {
  constructor(protected readonly model: Model<IUser> = userModel) {
    super(model);
  }
  async checkUser(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("Email already exists", 400);
    }
  }
}

export default UserRepository;
