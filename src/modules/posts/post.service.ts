import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "../../common/utilts/global-error-handler.js";
import UserRepository from "../../DB/repository/user.repository";
import redisService from "../../common/services/redis.service.js";
import { successResponse } from "../../common/utilts/response.success.js";
import { S3Service } from "../../common/services/s3.service.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";
import notificationService from "../../common/services/notification.service.js";
import { randomUUID } from "node:crypto";
import { createPostDTO, updatePostDTO } from "./post.dto.js";
import PostRepository from "../../DB/repository/post.repository.js";
import { Availability_Enum } from "../../common/enum/post.enum.js";
import { PostAvailability } from "../../common/utilts/post.utilts.js";

class PostService {
  private readonly _userRepo = new UserRepository();
  private readonly _postRepo = new PostRepository();

  private readonly _s3service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;

  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { content, allowComment, availability, tags }: createPostDTO =
      req.body;

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
        path: `users/${req?.user?._id}/posts/${folderId}`,
        store_type: Store_enum.memory,
      });
    }

    const post = await this._postRepo.create({
      attachments: urls,
      content: content!,
      createdBy: req?.user?._id!,
      tags: mentions,
      folderId,
      availability,
      allowComment,
    });

    if (!post) {
      await this._s3service.deleteFiles(urls);
      throw new AppError("fail to create post");
    }

    if (fcmTokens?.length) {
      await this._notificationService.sentNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mention on new post`,
          body: content || "new post",
        },
      });
    }
    successResponse({ res, data: post });
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const searchQuery = req.query?.search
      ? {
          content: {
            $regex: req.query.search,
            $options: "i",
          },
        }
      : {};

    const posts = await this._postRepo.paginate({
      page: +req.query?.page!,
      limit: +req.query?.limit!,
      search: {
        deletedAt: null,
        ...PostAvailability(req),
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

    successResponse({ res, data: posts });
  };

  getProfilePosts = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const user = await this._userRepo.findOne({
      filter: {
        _id: userId,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new AppError("profile not found or already deleted");
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
      page: +req.query?.page!,
      limit: +req.query?.limit!,
      search: {
        createdBy: userId,
        deletedAt: null,
        ...PostAvailability(req),
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

    successResponse({ res, data: posts });
  };

  getPost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const post = await this._postRepo.findOne({
      filter: {
        _id: postId,
        deletedAt: null,
        ...PostAvailability(req),
      },
    });

    successResponse({ res, data: post });
  };

  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { flag } = req.query;

    let updateQuery: any = {
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
        ...PostAvailability(req),
      },
      update: updateQuery,
    });

    if (!post) {
      throw new AppError("post not found or not authorized");
    }

    successResponse({ res, data: post });
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const {
      allowComment,
      availability,
      content,
      tags,
      removeFiles,
      removeTags,
    }: updatePostDTO = req.body;

    const post = await this._postRepo.findOne({
      filter: {
        _id: postId,
        createdBy: req?.user?._id!,
      },
    });

    if (!post) {
      throw new AppError("post not found or not authorized");
    }

    if (removeFiles?.length) {
      const inValidFiles = removeFiles.filter((file: string) => {
        return !post.attachments?.includes(file);
      });

      if (inValidFiles?.length) {
        throw new AppError("some path file you want remove not exist");
      }
      await this._s3service.deleteFiles(removeFiles);

      post.attachments = post.attachments?.filter((file: string) => {
        return !removeFiles.includes(file);
      }) as string[];
    }

    const updateTags = new Set(post?.tags?.map((id) => id.toString()));

    removeTags?.forEach((tag: string) => {
      return updateTags.delete(tag);
    });

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
        if (tag._id.toString() == req.user?._id.toString()) {
          throw new AppError("you can not mention yourself");
        }
        updateTags.add(tag._id.toString());
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
      post.tags = [...updateTags].map((id: string) => new Types.ObjectId(id));
    }

    if (req?.files) {
      let urls = await this._s3service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${post.folderId}`,
        store_type: Store_enum.memory,
      });

      post.attachments?.push(...urls);
    }

    if (fcmTokens?.length) {
      await this._notificationService.sentNotifications({
        tokens: fcmTokens,
        data: {
          title: content || "new post",
          body: `you are mention on new post`,
        },
      });
    }

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

    successResponse({ res, data: post });
  };

  softDeletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const post = await this._postRepo.findOneAndUpdate({
      filter: {
        _id: postId,
        deletedAt: null,
      },
      update: {
        deletedAt: new Date(),
        deletedBy: req.user?._id!,
        isDeleted: true,
      },
      options: {
        new: true,
      },
    });
    if (!post) {
      throw new AppError("post not found or already deleted");
    }
    return successResponse({
      res,
      message: "post soft deleted",
      data: post,
    });
  };

  hardDeletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const post = await this._postRepo.findOneAndDelete({
      filter: {
        _id: postId,
      },
    });
    if (!post) {
      throw new AppError("post not found");
    }

    return successResponse({
      res,
      message: "post hard deleted",
    });
  };
}

export default new PostService();
