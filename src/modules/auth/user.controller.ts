import { Router } from "express";
import UserService from "./user.service";
import { validation } from "../../common/middleware/validation";

import * as userValidation from "./user.validation";
import { authentication } from "../../common/middleware/authentication.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { Store_enum } from "../../common/enum/mutlter.enum.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  validation(userValidation.signUpSchema),
  UserService.signUp,
);

authRouter.post(
  "/comfirm-email",
  validation(userValidation.confirmEmailSchmea),
  UserService.confirmedEmail,
);

authRouter.patch("/resent-otp", UserService.resendConfirmOtp);

authRouter.post("/signup-with-gmail", UserService.signUpWithGmail);

authRouter.post(
  "/signin",
  validation(userValidation.logInSchema),
  UserService.signIn,
);

authRouter.patch(
  "/update-password",
  authentication,
  UserService.updatePassword,
);

authRouter.post("/send-otp-forget-password", UserService.sendForgetOtp);

authRouter.post("/forget-password", UserService.forgetPassword);

authRouter.post("/logout", authentication, UserService.logout);

authRouter.post(
  "/upload-file",
  multerCloud().single("attachment"),
  UserService.uploadfile,
);

authRouter.post(
  "/upload-large-file",
  multerCloud({ store_type: Store_enum.disk }).single("attachment"),
  UserService.uploadLargefile,
);

// authRouter.post(
//   "/upload-large-file",
//   multerCloud({ store_type: Store_enum.disk }).single("attachment"),
//   UserService.uploadLargefile,
// );
authRouter.post(
  "/upload-files",
  multerCloud({ store_type: Store_enum.disk }).array("attachments"),
  UserService.uploadfiles,
);

authRouter.post(
  "/upload",
  authentication,
  // multerCloud({ store_type: Store_enum.disk }).single("attachment"),
  UserService.upload,
);

authRouter.patch("/delete/:userId", authentication, UserService.softDeleteUser);

authRouter.delete(
  "/delete/:userId",
  authentication,
  UserService.softDeleteUser,
);

export default authRouter;
