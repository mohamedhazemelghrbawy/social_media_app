import { Router } from "express";
import postService from "./post.service";
import * as postValidation from "./post.validation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { validation } from "../../common/middleware/validation.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";
import commentRouter from "../comments/comment.controller.js";

const postRouter = Router();

postRouter.use("/:postId/comments{/:commentId,replies}", commentRouter);

postRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_enum.memory }).array("attachments"),
  validation(postValidation.createPostSchema),
  postService.createPost,
);

postRouter.post(
  "/:postId",
  authentication,
  multerCloud({ store_type: Store_enum.memory }).array("attachments"),
  validation(postValidation.updatePostSchema),
  postService.updatePost,
);

postRouter.post(
  "/:postId/like",
  authentication,

  validation(postValidation.likePostSchema),
  postService.likePost,
);

postRouter.get(
  "/",
  authentication,

  postService.getPosts,
);
postRouter.get(
  "/post/:postId",
  authentication,

  postService.getPost,
);

postRouter.patch(
  "/soft-delete/:postId",
  authentication,

  postService.softDeletePost,
);

postRouter.delete(
  "/hard-delete/:postId",
  authentication,

  postService.hardDeletePost,
);
export default postRouter;
