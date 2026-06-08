import mongoose, { Types } from "mongoose";

export interface IMessage {
  createdBy: Types.ObjectId;
  content: String;
}

export interface IChat {
  // o v o
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];

  // ovm
  group: string;
  groupImage: String;
  roomId: string;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    content: { type: String, required: false },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

const ChatSchema = new mongoose.Schema<IChat>(
  {
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    messages: [MessageSchema],

    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);

const ChatModel =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default ChatModel;
