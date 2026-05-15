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
// import notificationService from "../../common/services/notification.service.js";
const post_repository_js_1 = __importDefault(require("../../DB/repository/post.repository.js"));
const comment_repository_js_1 = __importDefault(require("../../DB/repository/comment.repository.js"));
const node_crypto_1 = require("node:crypto");
const mutlter_enum_js_1 = require("../../common/enum/mutlter.enum.js");
const post_utilts_js_1 = require("../../common/utilts/post.utilts.js");
const post_enum_js_1 = require("../../common/enum/post.enum.js");
class commentService {
    _userRepo = new user_repository_1.default();
    _commentRepo = new comment_repository_js_1.default();
    _postRepo = new post_repository_js_1.default();
    _s3service = new s3_service_js_1.S3Service();
    _redisService = redis_service_js_1.default;
    // private readonly _notificationService = notificationService;
    constructor() { }
    createComment = async (req, res, next) => {
        const { content, tags, onModel } = req.body;
        const { postId, commentId } = req.params;
        let doc = null;
        if (onModel === post_enum_js_1.On_Model_Enum.Post && !commentId) {
            doc = await this._postRepo.findOne({
                filter: {
                    _id: postId,
                    $or: [(0, post_utilts_js_1.PostAvailability)(req)],
                    allowedComment: post_enum_js_1.Allow_Comment_Enum.allow,
                },
            });
            if (!doc) {
                throw new global_error_handler_js_1.AppError("post not found or you are not allowded to comment on this post ", 404);
            }
        }
        else if (onModel === post_enum_js_1.On_Model_Enum.Comment && commentId) {
            // create reply
            let comment = await this._commentRepo.findOne({
                filter: {
                    _id: commentId,
                    refId: postId,
                },
                options: {
                    populate: [
                        {
                            path: "refId",
                            match: {
                                $or: [(0, post_utilts_js_1.PostAvailability)(req)],
                                allowComment: post_enum_js_1.Allow_Comment_Enum.allow,
                            },
                        },
                    ],
                },
            });
            if (!comment?.refId) {
                throw new global_error_handler_js_1.AppError("Comment not found or you are not allowded to comment on this post ", 404);
                doc = comment;
            }
        }
        if (!doc) {
            throw new global_error_handler_js_1.AppError("invalid onModel value", 400);
        }
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
                if (tag?._id?.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_js_1.AppError("you can not mention yourself");
                }
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
                store_type: mutlter_enum_js_1.Store_enum.memory,
            });
        }
        const comment = await this._commentRepo.create({
            attachments: urls,
            content: content,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            refId: doc?._id,
        });
        if (!comment) {
            await this._s3service.deleteFiles(urls);
            throw new global_error_handler_js_1.AppError("fail to create comment");
        }
        // if (fcmTokens?.length) {
        //   await this._notificationService.sentNotifications({
        //     tokens: fcmTokens,
        //     data: {
        //       title: `you are mention on new comment`,
        //       body: content || "new comment",
        //     },
        //   });
        // }
        (0, response_success_js_1.successResponse)({ res, data: comment });
    };
    softDeleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentRepo.findOneAndUpdate({
            filter: {
                _id: commentId,
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
        if (!comment) {
            throw new global_error_handler_js_1.AppError("comment not found or already deleted");
        }
        return (0, response_success_js_1.successResponse)({
            res,
            message: "comment soft deleted",
            data: comment,
        });
    };
    hardDeleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentRepo.findOneAndDelete({
            filter: {
                _id: commentId,
            },
        });
        if (!comment) {
            throw new global_error_handler_js_1.AppError("comment not found");
        }
        return (0, response_success_js_1.successResponse)({
            res,
            message: "comment hard deleted",
        });
    };
}
exports.default = new commentService();
