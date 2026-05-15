"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const global_error_handler_js_1 = require("../../common/utilts/global-error-handler.js");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const redis_service_js_1 = __importDefault(require("../../common/services/redis.service.js"));
const response_success_js_1 = require("../../common/utilts/response.success.js");
const s3_service_js_1 = require("../../common/services/s3.service.js");
const mutlter_enum_js_1 = require("../../common/enum/mutlter.enum.js");
// import notificationService from "../../common/services/notification.service.js";
const node_crypto_1 = require("node:crypto");
const post_repository_js_1 = __importDefault(require("../../DB/repository/post.repository.js"));
const post_utilts_js_1 = require("../../common/utilts/post.utilts.js");
const comment_repository_js_1 = __importDefault(require("../../DB/repository/comment.repository.js"));
class PostService {
    _userRepo = new user_repository_1.default();
    _postRepo = new post_repository_js_1.default();
    _commentRepo = new comment_repository_js_1.default();
    _s3service = new s3_service_js_1.S3Service();
    _redisService = redis_service_js_1.default;
    // private readonly _notificationService = notificationService;
    constructor() { }
    createPost = async (req, res, next) => {
        const { content, allowComment, availability, tags } = req.body;
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
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: mutlter_enum_js_1.Store_enum.memory,
            });
        }
        const post = await this._postRepo.create({
            attachments: urls,
            content: content,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            availability,
            allowComment,
        });
        if (!post) {
            await this._s3service.deleteFiles(urls);
            throw new global_error_handler_js_1.AppError("fail to create post");
        }
        // if (fcmTokens?.length) {
        //   await this._notificationService.sentNotifications({
        //     tokens: fcmTokens,
        //     data: {
        //       title: `you are mention on new post`,
        //       body: content || "new post",
        //     },
        //   });
        // }
        (0, response_success_js_1.successResponse)({ res, data: post });
    };
    getPosts = async (req, res, next) => {
        // const searchQuery = req.query?.search
        //   ? {
        //       content: {
        //         $regex: req.query.search,
        //         $options: "i",
        //       },
        //     }
        //   : {};
        // const posts = await this._postRepo.paginate({
        //   page: +req.query?.page!,
        //   limit: +req.query?.limit!,
        //   search: {
        //     deletedAt: null,
        //     ...PostAvailability(req),
        //     ...searchQuery,
        //   },
        //   sort: { createdAt: -1 },
        // });
        const posts = await this._postRepo.find({
            filter: {
                deletedAt: null,
                $or: [(0, post_utilts_js_1.PostAvailability)(req)],
            },
            options: {
                populate: [
                    {
                        path: "comments",
                        match: {
                            refId: { $exists: false },
                        },
                        populate: [
                            {
                                path: "replies",
                            },
                        ],
                    },
                ],
            },
        });
        // let doc = [];
        // for (const post of posts) {
        //   const comments = await this._commentRepo.find({
        //     filter: {
        //       postId: post._id,
        //     },
        //   });
        //   doc.push({ ...post.toObject(), comments });
        // }
        (0, response_success_js_1.successResponse)({ res, data: posts });
    };
    getProfilePosts = async (req, res, next) => {
        const { userId } = req.params;
        const user = await this._userRepo.findOne({
            filter: {
                _id: userId,
                deletedAt: null,
            },
        });
        if (!user) {
            throw new global_error_handler_js_1.AppError("profile not found or already deleted");
        }
        const searchQuery = req.query?.search
            ? {
                content: {
                    $regex: req.query.search,
                    $options: "i",
                },
            }
            : {};
        const posts = await this._postRepo.paginate({
            page: +req.query?.page,
            limit: +req.query?.limit,
            search: {
                createdBy: userId,
                deletedAt: null,
                ...(0, post_utilts_js_1.PostAvailability)(req),
                ...searchQuery,
            },
            sort: { createdAt: -1 },
        });
        // const posts = await this._postRepo.find({
        //   filter: {
        // deletedAt: null,
        //     $or: [
        //       { availability: Availability_Enum.public },
        //       {
        //         availability: Availability_Enum.only_me,
        //         createdBy: req.user?._id!,
        //       },
        //       {
        //         availability: Availability_Enum.friends,
        //         createdBy: {
        //           $in: [...(req.user?.friends || []), req.user?._id],
        //         },
        //       },
        //       { tags: { $in: [req.user?._id] } },
        //     ],
        //   },
        // });
        (0, response_success_js_1.successResponse)({ res, data: posts });
    };
    getPost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                deletedAt: null,
                ...(0, post_utilts_js_1.PostAvailability)(req),
            },
        });
        (0, response_success_js_1.successResponse)({ res, data: post });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { flag } = req.query;
        let updateQuery = {
            $addToSet: { likes: req.user?._id },
        };
        if (flag && flag == "dislike") {
            updateQuery = {
                $pull: { likes: req.user?._id },
            };
        }
        const post = await this._postRepo.findOneAndUpdate({
            filter: {
                _id: postId,
                ...(0, post_utilts_js_1.PostAvailability)(req),
            },
            update: updateQuery,
        });
        if (!post) {
            throw new global_error_handler_js_1.AppError("post not found or not authorized");
        }
        (0, response_success_js_1.successResponse)({ res, data: post });
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        const { allowComment, availability, content, tags, removeFiles, removeTags, } = req.body;
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                createdBy: req?.user?._id,
            },
        });
        if (!post) {
            throw new global_error_handler_js_1.AppError("post not found or not authorized");
        }
        if (removeFiles?.length) {
            const inValidFiles = removeFiles.filter((file) => {
                return !post.attachments?.includes(file);
            });
            if (inValidFiles?.length) {
                throw new global_error_handler_js_1.AppError("some path file you want remove not exist");
            }
            await this._s3service.deleteFiles(removeFiles);
            post.attachments = post.attachments?.filter((file) => {
                return !removeFiles.includes(file);
            });
        }
        const updateTags = new Set(post?.tags?.map((id) => id.toString()));
        removeTags?.forEach((tag) => {
            return updateTags.delete(tag);
        });
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
                    throw new global_error_handler_js_1.AppError("you can not mention yourself");
                }
                updateTags.add(tag._id.toString());
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
            post.tags = [...updateTags].map((id) => new mongoose_1.Types.ObjectId(id));
        }
        if (req?.files) {
            let urls = await this._s3service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${post.folderId}`,
                store_type: mutlter_enum_js_1.Store_enum.memory,
            });
            post.attachments?.push(...urls);
        }
        // if (fcmTokens?.length) {
        //   await this._notificationService.sentNotifications({
        //     tokens: fcmTokens,
        //     data: {
        //       title: content || "new post",
        //       body: `you are mention on new post`,
        //     },
        //   });
        // }
        if (content) {
            post.content = content;
        }
        if (availability) {
            post.availability = availability;
        }
        if (allowComment) {
            post.allowComment = allowComment;
        }
        await post.save();
        (0, response_success_js_1.successResponse)({ res, data: post });
    };
    softDeletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postRepo.findOneAndUpdate({
            filter: {
                _id: postId,
                deletedAt: null,
            },
            update: {
                deletedAt: new Date(),
                deletedBy: req.user._id,
            },
            options: {
                new: true,
            },
        });
        if (!post) {
            throw new global_error_handler_js_1.AppError("post not found or already deleted");
        }
        return (0, response_success_js_1.successResponse)({
            res,
            message: "post soft deleted",
            data: post,
        });
    };
    hardDeletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postRepo.findOne({
            filter: { _id: postId },
        });
        if (!post) {
            throw new global_error_handler_js_1.AppError("post not found");
        }
        await this._commentRepo.deleteMany({
            filter: {
                postId: post._id,
            },
        });
        await this._postRepo.findOneAndDelete({
            filter: { _id: postId },
        });
        if (post.attachments?.length) {
            await this._s3service.deleteFiles(post.attachments);
        }
        return (0, response_success_js_1.successResponse)({
            res,
            message: "post and related comments deleted successfully",
        });
    };
}
exports.default = new PostService();
