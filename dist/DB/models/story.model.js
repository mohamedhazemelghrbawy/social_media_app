"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const post_enum_1 = require("../../common/enum/post.enum");
const StorySchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        min: 1,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    mentions: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    reactions: [
        {
            userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
            type: {
                type: String,
                enum: ["like", "love", "haha", "wow", "sad", "angry"],
                required: true,
            },
        },
    ],
    availability: {
        type: String,
        enum: post_enum_1.Availability_Enum,
        default: post_enum_1.Availability_Enum.public,
    },
    views: [
        {
            userId: { type: mongoose_1.Types.ObjectId, ref: "User" },
            viewedAt: { type: Date, default: Date.now },
        },
    ],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
    strict: true,
});
const StoryModel = mongoose_1.default.models.Story ||
    mongoose_1.default.model("Story", StorySchema);
// PostSchema.post("findOneAndUpdate", async function (doc) {
//   if (!doc?.deletedAt) return;
//   const postId = doc._id;
//   await postModel.updateMany({ createdBy: userId }, { deletedAt: new Date() });
// });
exports.default = StoryModel;
