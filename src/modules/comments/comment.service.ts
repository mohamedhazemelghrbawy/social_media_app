import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "../../common/utilts/global-error-handler.js";
import UserRepository from "../../DB/repository/user.repository";
import redisService from "../../common/services/redis.service.js";
import { successResponse } from "../../common/utilts/response.success.js";
import { S3Service } from "../../common/services/s3.service.js";

import notificationService from "../../common/services/notification.service.js";

import PostRepository from "../../DB/repository/post.repository.js";
import CommentModel from "../../DB/models/comment.model.js";
import CommentRepository from "../../DB/repository/comment.repository.js";

class PostService {
  private readonly _userRepo = new UserRepository();
  private readonly _commentRepo = new CommentRepository();

  private readonly _s3service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;

  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { content, tags } = req.body;

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];

    const post = await this._commentRepo.findOne({
      filter: {
        _id: postId,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new AppError("post not found");
    }

    if (tags?.length) {
      const mentionsTags = await this._userRepo.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (tags.length != mentionsTags.length) {
        throw new AppError("invalid tag id");
      }

      for (const tag of mentionsTags) {
        if (tag._id.toString() === req.user?._id.toString()) {
          throw new AppError("you cannot tag yourself");
        }

        mentions.push(tag._id);

        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }
    if (!Types.ObjectId.isValid(postId as any)) {
      throw new AppError("invalid post id");
    }

    const comment = await this._commentRepo.create({
      content,
      createdBy: req.user?._id!,
      tags: mentions,
      postId: new Types.ObjectId(postId as any),
    });

    if (!comment) {
      throw new AppError("fail to create comment");
    }

    if (fcmTokens?.length) {
      await this._notificationService.sentNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned on a comment`,
          body: content || "new comment",
        },
      });
    }

    successResponse({
      res,
      data: comment,
    });
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

export default new PostService();
