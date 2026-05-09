import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { Model } from "mongoose";

export interface IStory {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  views: {
    userId: Types.ObjectId;
    viewedAt: Date;
  }[];
  expiresAt: Date;
  tags?: Types.ObjectId[];
  reactions: {
    userId: Types.ObjectId;
    type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
  }[];

  availability?: Availability_Enum;
  createdAt?: Date;
  deletedAt?: Date;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
}
const StorySchema = new mongoose.Schema<IStory>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: [String],

    createdBy: { type: Types.ObjectId, ref: "User", required: true },

    tags: [{ type: Types.ObjectId, ref: "User" }],
    reactions: [
      {
        userId: { type: Types.ObjectId, ref: "User", required: true },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
          required: true,
        },
      },
    ],
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
    },
    views: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
    strict: true,
  },
);

const StoryModel: Model<IStory> =
  (mongoose.models.Story as Model<IStory>) ||
  mongoose.model<IStory>("Story", StorySchema);

export default StoryModel;
