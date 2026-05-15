import { Request, Response, NextFunction } from "express";
import { HydratedDocument, Types } from "mongoose";
import { AppError } from "../../common/utilts/global-error-handler.js";
import UserRepository from "../../DB/repository/user.repository";
import redisService from "../../common/services/redis.service.js";
import { successResponse } from "../../common/utilts/response.success.js";
import { S3Service } from "../../common/services/s3.service.js";

import notificationService from "../../common/services/notification.service.js";

import PostRepository from "../../DB/repository/post.repository.js";
import CommentModel, { IComment } from "../../DB/models/comment.model.js";
import CommentRepository from "../../DB/repository/comment.repository.js";
import { randomUUID } from "node:crypto";
import { createCommentDTO } from "./comment.dto.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";
import { PostAvailability } from "../../common/utilts/post.utilts.js";
import {
  Allow_Comment_Enum,
  On_Model_Enum,
} from "../../common/enum/post.enum.js";
import { populate } from "dotenv";
import { IPost } from "../../DB/models/post.model.js";

class commentService {
  private readonly _userRepo = new UserRepository();
  private readonly _commentRepo = new CommentRepository();
  private readonly _postRepo = new PostRepository();
  private readonly _s3service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;

  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { content, tags, onModel }: createCommentDTO = req.body;
    const { postId, commentId } = req.params;

    let doc: HydratedDocument<IPost | IComment> | null = null;

    if (onModel === On_Model_Enum.Post && !commentId) {
      doc = await this._postRepo.findOne({
        filter: {
          _id: postId,

          $or: [PostAvailability(req)],
          allowedComment: Allow_Comment_Enum.allow,
        },
      });

      if (!doc) {
        throw new AppError(
          "post not found or you are not allowded to comment on this post ",
          404,
        );
      }
    } else if (onModel === On_Model_Enum.Comment && commentId) {
      // create reply

      let comment = await this._commentRepo.findOne({
        filter: {
          _id: commentId,
          refId: postId!,
        },
        options: {
          populate: [
            {
              path: "refId",
              match: {
                $or: [PostAvailability(req)],
                allowComment: Allow_Comment_Enum.allow,
              },
            },
          ],
        },
      });

      if (!comment?.refId) {
        throw new AppError(
          "Comment not found or you are not allowded to comment on this post ",
          404,
        );

        doc = comment;
      }
    }

    if (!doc) {
      throw new AppError("invalid onModel value", 400);
    }

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userRepo.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (tags.length != mentionsTags.length) {
        throw new AppError("inValid tag id");
      }
      for (const tag of mentionsTags) {
        if (tag?._id?.toString() == (req as any).user?._id.toString()) {
          throw new AppError("you can not mention yourself");
        }
        mentions.push(tag._id);
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();
    if (req?.files) {
      urls = await this._s3service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
        store_type: Store_enum.memory,
      });
    }

    const comment = await this._commentRepo.create({
      attachments: urls,
      content: content!,
      createdBy: req?.user?._id!,
      tags: mentions,
      folderId,
      refId: doc?._id!,
    });

    if (!comment) {
      await this._s3service.deleteFiles(urls);
      throw new AppError("fail to create comment");
    }

    if (fcmTokens?.length) {
      await this._notificationService.sentNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mention on new comment`,
          body: content || "new comment",
        },
      });
    }
    successResponse({ res, data: comment });
  };

  softDeleteComment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { commentId } = req.params;

    const comment = await this._commentRepo.findOneAndUpdate({
      filter: {
        _id: commentId,
        deletedAt: null,
      },
      update: {
        deletedAt: new Date(),
        deletedBy: req.user!._id,
      },
      options: {
        new: true,
      },
    });

    if (!comment) {
      throw new AppError("comment not found or already deleted");
    }

    return successResponse({
      res,
      message: "comment soft deleted",
      data: comment,
    });
  };

  hardDeleteComment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { commentId } = req.params;

    const comment = await this._commentRepo.findOneAndDelete({
      filter: {
        _id: commentId,
      },
    });

    if (!comment) {
      throw new AppError("comment not found");
    }

    return successResponse({
      res,
      message: "comment hard deleted",
    });
  };
}

export default new commentService();
