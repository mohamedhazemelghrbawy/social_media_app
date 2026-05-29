// npm i -D @types/mongoose
import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service";

const checkConnectionDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/social_app");
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error, "DB connection faild");
  }
};

export default checkConnectionDB;
