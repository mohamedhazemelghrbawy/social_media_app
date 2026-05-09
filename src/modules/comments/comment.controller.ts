import { Router } from "express";
import commentService from "./comment.service";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { validation } from "../../common/middleware/validation.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";

const commentRouter = Router();

commentRouter.post("/:postId", authentication, commentService.createComment);

commentRouter.patch(
  "/delete/:commentId",
  authentication,
  commentService.softDeleteComment,
);

commentRouter.delete(
  "/delete/:commentId",
  authentication,
  commentService.hardDeleteComment,
);

export default commentRouter;
