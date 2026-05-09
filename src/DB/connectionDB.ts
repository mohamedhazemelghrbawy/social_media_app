// npm i -D @types/mongoose
import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service";

const checkConnectionDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error, "DB connection faild");
  }
};

export default checkConnectionDB;
