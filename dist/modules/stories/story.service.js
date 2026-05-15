"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handler_js_1 = require("../../common/utilts/global-error-handler.js");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const redis_service_js_1 = __importDefault(require("../../common/services/redis.service.js"));
const response_success_js_1 = require("../../common/utilts/response.success.js");
const s3_service_js_1 = require("../../common/services/s3.service.js");
const mutlter_enum_js_1 = require("../../common/enum/mutlter.enum.js");
const notification_service_js_1 = __importDefault(require("../../common/services/notification.service.js"));
const node_crypto_1 = require("node:crypto");
const post_enum_js_1 = require("../../common/enum/post.enum.js");
const story_repository_js_1 = __importDefault(require("../../DB/repository/story.repository.js"));
class StoryService {
    _userRepo = new user_repository_1.default();
    _storyRepo = new story_repository_js_1.default();
    _s3service = new s3_service_js_1.S3Service();
    // private readonly _redisService = redisService;
    _notificationService = notification_service_js_1.default;
    constructor() { }
    createStory = async (req, res, next) => {
        const { content, tags } = req.body;
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionsTags = await this._userRepo.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (tags.length != mentionsTags.length) {
                throw new global_error_handler_js_1.AppError("inValid tag id");
            }
            for (const tag of mentionsTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_js_1.AppError("you can not tag yourself");
                }
                mentions.push(tag._id);
                (await redis_service_js_1.default.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/stories/${folderId}`,
                store_type: mutlter_enum_js_1.Store_enum.memory,
            });
        }
        const story = await this._storyRepo.create({
            attachments: urls,
            content: content,
            createdBy: req?.user?._id,
            tags: mentions,
        });
        if (!story) {
            await this._s3service.deleteFiles(urls);
            throw new global_error_handler_js_1.AppError("fail to create story");
        }
        if (fcmTokens?.length) {
            await this._notificationService.sentNotifications({
                tokens: fcmTokens,
                data: {
                    title: `you are mention on new story`,
                    body: content || "new story",
                },
            });
        }
        (0, response_success_js_1.successResponse)({ res, data: story });
    };
    getStories = async (req, res, next) => {
        const stories = await this._storyRepo.find({
            filter: {
                deletedAt: null,
                expiresAt: { $gt: new Date() },
                $or: [
                    { createdBy: req.user?._id },
                    { createdBy: { $in: req.user?.friends || [] } },
                    {
                        availability: post_enum_js_1.Availability_Enum.public,
                    },
                ],
            },
        });
        (0, response_success_js_1.successResponse)({ res, data: stories });
    };
    getStory = async (req, res, next) => {
        const { storyId } = req.params;
        const story = await this._storyRepo.findOne({
            filter: {
                _id: storyId,
                deletedAt: null,
                $or: [
                    { createdBy: req.user?._id },
                    { createdBy: { $in: req.user?.friends || [] } },
                    {
                        availability: post_enum_js_1.Availability_Enum.public,
                    },
                ],
            },
        });
        if (!story) {
            throw new global_error_handler_js_1.AppError("story not found or not allowed");
        }
        (0, response_success_js_1.successResponse)({ res, data: story });
    };
    // reactStory = async (req: Request, res: Response, next: NextFunction) => {
    //   const { storyId } = req.params;
    //   const { reaction } = req.body;
    //   const { flag } = req.query;
    //   let updateQuery: any = {
    //     $addToSet: { reaction },
    //   };
    //   if (flag && flag == "dislike") {
    //     updateQuery = {
    //       $pull: { reaction },
    //     };
    //   }
    //   const story = await this._storyRepo.findOne({
    //     filter: {
    //       _id: storyId,
    //       deletedAt: null,
    //       expiresAt: { $gt: new Date() },
    //     },
    //   });
    //   if (!story) {
    //     throw new AppError("post not found or not authorized");
    //   }
    //   successResponse({ res, data: story });
    // };
    //   updatePost = async (req: Request, res: Response, next: NextFunction) => {
    //     const { postId } = req.params;
    //     const {
    //       allowComment,
    //       availability,
    //       content,
    //       tags,
    //       removeFiles,
    //       removeTags,
    //     } = req.body;
    //     const post = await this._storyRepo.findOne({
    //       filter: {
    //         _id: postId,
    //         createdBy: req?.user?._id!,
    //       },
    //     });
    //     if (!post) {
    //       throw new AppError("post not found or not authorized");
    //     }
    //     if (removeFiles?.length) {
    //       const inValidFiles = removeFiles.filter((file: string) => {
    //         return !post.attachments?.includes(file);
    //       });
    //       if (inValidFiles?.length) {
    //         throw new AppError("some path file you want remove not exist");
    //       }
    //       await this._s3service.deleteFiles(removeFiles);
    //       post.attachments = post.attachments?.filter((file: string) => {
    //         return !removeFiles.includes(file);
    //       }) as string[];
    //     }
    //     const updateTags = new Set(post?.tags?.map((id) => id.toString()));
    //     removeTags?.forEach((tag: string) => {
    //       return updateTags.delete(tag);
    //     });
    //     let fcmTokens: string[] = [];
    //     if (tags?.length) {
    //       const mentionsTags = await this._userRepo.find({
    //         filter: {
    //           _id: { $in: tags },
    //         },
    //       });
    //       if (tags.length != mentionsTags.length) {
    //         throw new AppError("inValid tag id");
    //       }
    //       for (const tag of mentionsTags) {
    //         if (tag._id.toString() == req.user?._id.toString()) {
    //           throw new AppError("you can not mention yourself");
    //         }
    //         updateTags.add(tag._id.toString());
    //         (await redisService.getFCMs(tag._id)).map((token) =>
    //           fcmTokens.push(token),
    //         );
    //       }
    //       post.tags = [...updateTags].map((id: string) => new Types.ObjectId(id));
    //     }
    //     if (req?.files) {
    //       let urls = await this._s3service.uploadFiles({
    //         files: req.files as Express.Multer.File[],
    //         path: `users/${req?.user?._id}/posts/${post.folderId}`,
    //         store_type: Store_enum.memory,
    //       });
    //       post.attachments?.push(...urls);
    //     }
    //     if (fcmTokens?.length) {
    //       await this._notificationService.sentNotifications({
    //         tokens: fcmTokens,
    //         data: {
    //           title: content || "new post",
    //           body: `you are mention on new post`,
    //         },
    //       });
    //     }
    //     if (content) {
    //       post.content = content;
    //     }
    //     if (availability) {
    //       post.availability = availability;
    //     }
    //     if (allowComment) {
    //       post.allowComment = allowComment;
    //     }
    //     await post.save();
    //     successResponse({ res, data: post });
    //   };
    softDeleteStory = async (req, res, next) => {
        const { storyId } = req.params;
        const story = await this._storyRepo.findOneAndUpdate({
            filter: {
                _id: storyId,
                deletedAt: null,
            },
            update: {
                deletedAt: new Date(),
                deletedBy: req.user?._id,
                isDeleted: true,
            },
            options: {
                new: true,
            },
        });
        if (!story) {
            throw new global_error_handler_js_1.AppError("story not found or already deleted ");
        }
        return (0, response_success_js_1.successResponse)({
            res,
            message: "story soft deleted",
            data: story,
        });
    };
    hardDeleteStory = async (req, res, next) => {
        const { storyId } = req.params;
        const story = await this._storyRepo.findOneAndDelete({
            filter: {
                _id: storyId,
                createdBy: req.user?._id,
            },
        });
        if (!story) {
            throw new global_error_handler_js_1.AppError("story not found");
        }
        await this._s3service.deleteFiles(story.attachments);
        return (0, response_success_js_1.successResponse)({
            res,
            message: "story hard deleted",
        });
    };
}
exports.default = new StoryService();
