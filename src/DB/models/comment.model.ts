import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { Model } from "mongoose";

export interface IComment {
  content?: string;
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  tags?: Types.ObjectId[];
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

const CommentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      min: 1,
    },

    createdBy: { type: Types.ObjectId, ref: "User", required: true },

    tags: [{ type: Types.ObjectId, ref: "User" }],

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
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

const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
