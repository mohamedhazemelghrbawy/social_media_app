import { Router } from "express";
import commentService from "./comment.service";
import { authentication } from "../../common/middleware/authentication";
import * as commentValidation from "./comment.validaton.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { validation } from "../../common/middleware/validation.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_enum.memory }).array("attachments"),
  validation(commentValidation.createCommentSchema),
  commentService.createComment,
);

// commentRouter.post(
//   "/:commentId,replies",
//   authentication,
//   multerCloud({ store_type: Store_enum.memory }).array("attachments"),
//   commentService.createReply,
// );

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
