import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { Model } from "mongoose";

export interface IPost {
  content?: string;
  attachments?: string[];

  createdBy: Types.ObjectId;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];

  allowComment?: Allow_Comment_Enum;
  availability?: Availability_Enum;
  deletedAt?: Date;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
  folderId: string;
}

const PostSchema = new mongoose.Schema<IPost>(
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
    likes: [{ type: Types.ObjectId, ref: "User" }],

    allowComment: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
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

const postModel: Model<IPost> =
  (mongoose.models.post as Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);

// PostSchema.post("findOneAndUpdate", async function (doc) {
//   if (!doc?.deletedAt) return;

//   const postId = doc._id;

//   await postModel.updateMany({ createdBy: userId }, { deletedAt: new Date() });
// });

export default postModel;
