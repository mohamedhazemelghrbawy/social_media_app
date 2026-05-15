import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
  On_Model_Enum,
} from "../../common/enum/post.enum";
import { Model } from "mongoose";

export interface IComment {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  folderId?: string;
  //   postId: Types.ObjectId;
  // commentId?: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: On_Model_Enum;
}

const CommentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      min: 1,
    },
    attachments: [String],

    createdBy: { type: Types.ObjectId, ref: "User", required: true },

    tags: [{ type: Types.ObjectId, ref: "User" }],

    likes: [{ type: Types.ObjectId, ref: "User" }],

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    // postId: {
    //   type: Types.ObjectId,
    //   ref: "Post",
    //   required: true,
    // },
    // commentId: { type: Types.ObjectId, ref: "Comment" },
    refId: { type: Types.ObjectId, refPath: "onModel" },
    onModel: { type: String, enum: On_Model_Enum, required: true },
    folderId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
    strict: true,
  },
);
CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
});

const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
