import type { Request, Response, NextFunction } from "express";
import { ISignUpType } from "./auth.dto";
import { ProviderEnum } from "../../common/enum/user.enum";
import { AppError } from "../../common/utilts/global-error-handler";
import { successResponse } from "../../common/utilts/response.success";
import { signUpSchema } from "./user.validation";
import userModel, { IUser } from "../../DB/models/user.model";
import UserRepository from "../../DB/repository/user.repository";
import { encrypt } from "../../common/utilts/security/encrypt.security";
import { Compare, Hash } from "../../common/utilts/security/hash.security";
import { generateOTP, sendEmail } from "../../common/utilts/email/send.email";
import { emailTemplate } from "../../common/utilts/email/email.template";
import redisService from "../../common/services/redis.service";
import { randomUUID } from "crypto";
import { generateToken } from "../../common/utilts/token.service";
import {
  GOOGLE_CLIENT_ID,
  REFRESH_SECRET_KEY,
  SECRET_KEY,
} from "../../config/config.service";
import { S3Service } from "../../common/services/s3.service";
import { sendOtp } from "../../common/utilts/email/otp.resend";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { eventEmitter } from "../../common/utilts/email/email.event";
import { Store_enum } from "../../common/enum/mutlter.enum.js";
import NotificationService from "../../common/services/notification.service";
import postModel from "../../DB/models/post.model.js";
import PostRepository from "../../DB/repository/post.repository.js";
import { Types } from "mongoose";
// import { emit } from "cluster";
class UserService {
  private readonly _userModel = new UserRepository();
  private readonly _postRepo = new PostRepository();
  private readonly _s3Service = new S3Service();
  private readonly _notificationService = NotificationService;
  constructor() {}

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    let { userName, email, password, cPassword, phone, address, age, gender } =
      req.body;

    await this._userModel.checkUser(email);

    const user = await this._userModel.create({
      userName,
      email,
      password: Hash({ plainText: password }),
      phone: phone ? encrypt(phone) : null,
      address,
      age,
      gender,
    } as Partial<IUser>);
    console.log(3);
    const otp = await generateOTP();

    const type = "signupOtp";

    // eventEmitter.on("confirmed", async ({ email, userName, otp }) => {
    await sendEmail({
      to: email,
      subject: "Email Confirmation",
      html: emailTemplate(userName, otp, "Welcome to social media app"),
    });

    await redisService.setValue({
      key: redisService.otp_key({ email, type }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 4,
    });

    await redisService.setValue({
      key: redisService.max_otp_key({ email, type }),
      value: 1,
      ttl: 60 * 30,
    });
    // });

    await redisService.setValue({
      key: redisService.otp_key({ email, type }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 4,
    });
    console.log(9);
    successResponse({
      res,
      status: 201,
      message: "Signup successful",
      data: user,
    });
  };

  signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID as string,
    });
    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload) {
      throw new AppError("Invalid Google token", 401);
    }

    const { email, email_verified, name } = payload;

    if (!email || !email_verified) {
      throw new AppError("Google account not verified", 401);
    }
    let user = await this._userModel.findOne({
      filter: { email },
    });

    if (!user) {
      user = await this._userModel.create({
        email,
        confirmed: email_verified,
        userName: name,

        provider: ProviderEnum.google,
      } as Partial<IUser>);
    }
    if (user.provider == ProviderEnum.system) {
      throw new AppError("please");
    }

    const access_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: SECRET_KEY as string,
      options: { expiresIn: "1h" },
    });
    successResponse({
      res,
      message: "success login",
      status: 201,
      data: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        access_token,
      },
    });
  };

  confirmedEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const otpExist = await redisService.get(
      redisService.otp_key({ email, type: "signupOtp" }),
    );
    if (!otpExist) {
      throw new Error("otp exired or incorrect");
    }
    const userr = await this._userModel.findOne({ filter: { email } });

    if (!userr) throw new Error("user not found");

    if (userr.confirmed) {
      throw new Error("Account already confirmed");
    }
    if (userr.provider !== ProviderEnum.system) {
      if (!Compare({ plainText: otp, cipherText: otpExist })) {
        throw new Error("Invalid otp");
      }
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        confirmed: false,
        provider: ProviderEnum.system,
      },
      update: { confirmed: true },
    });
    if (!user) {
      throw new AppError("user not exist");
    }
    await redisService.deleteKey(
      redisService.otp_key({ email, type: "signupOtp" }),
    );
    successResponse({
      res,
      message: "confirmed done",
    });
  };

  resendConfirmOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email } = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.system,
      },
    });
    if (!user || user.confirmed) {
      throw new Error("user not exist or already confirmed");
    }

    await sendOtp({
      email,
      userName: user.userName!,
      message: "welcome to social media app your otp is",
      type: "confirmedEmail",
    });
    // await deleteKey(otp_key({ email }));
    // await deleteKey(max_otp_key({ email }));
    // await deleteKey(block_otp_key({ email }));
    successResponse({ res, message: "OTP resent successfully" });
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    let { email, password, fcm } = req.body;

    const user = await this._userModel.findOne({ filter: { email } });

    if (!user) {
      throw new AppError("Email is not exist");
    }

    const blockedTime = await redisService.ttlTimer(
      redisService.block_password_key({ email }),
    );
    if (!Compare({ plainText: password, cipherText: user.password })) {
      if (blockedTime > 0) {
        throw new Error(
          `you have executed the maximum number of tries , please try again after ${blockedTime} seconds`,
        );
      }
      let maxPass =
        Number(
          await redisService.get(redisService.max_password_key({ email })),
        ) || 0;

      if (maxPass >= 5) {
        await redisService.setValue({
          key: redisService.block_password_key({ email }),
          value: 1,
          ttl: 60 * 5,
        });

        throw new Error("you have executed the maximum number of tries");
      }

      await redisService.setValue({
        key: redisService.max_password_key({ email }),
        value: maxPass + 1,
        ttl: 60 * 5,
      });

      throw new AppError("Invalid password");
    }

    const jwtid = randomUUID();

    const access_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: SECRET_KEY!,
      options: { expiresIn: 60 * 20, jwtid },
    });

    const refresh_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: REFRESH_SECRET_KEY!,
      options: { expiresIn: "1y", jwtid },
    });

    if (fcm) {
      await redisService.addFCM({ userId: user._id, FCMToken: fcm });
      const tokens = await redisService.getFCMs(user._id);
      await this._notificationService.sentNotifications({
        tokens,
        data: {
          title: `hi ${user.firstName}`,
          body: `new login at ${new Date()}`,
        },
      });
    }

    // await redisService.deleteKey(redisService.max_password_key({ email }));
    // await redisService.deleteKey(redisService.block_password_key({ email }));

    successResponse({
      res,
      message: "user signed in successfully",
      data: {
        user,
        access_token,
        refresh_token,
      },
    });
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    let { oldPassword, newPassword } = req.body;

    if (
      !Compare({
        plainText: oldPassword,
        cipherText: (req as any).user.password,
      })
    ) {
      throw new Error("invalid old password");
    }
    const hash = Hash({ plainText: newPassword });
    (req as any).user.password = hash;
    (req as any).user.changeCredential = new Date();
    await (req as any).user.save();
    successResponse({
      res,
      message: "done",
    });
  };

  sendForgetOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await this._userModel.findOne({
      filter: { email },
    });
    if (!user) throw new Error("User not found");
    const type = "forgetPassword";
    await sendOtp({
      email,
      userName: user.userName!,
      message: "to reset password is",
      type,
    });
    // await deleteKey(otp_key({ email, type }));
    // await deleteKey(max_otp_key({ email, type }));
    // await deleteKey(block_otp_key({ email, type }));
    successResponse({
      res,
      message: "OTP sent successfully",
    });
  };

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        throw new Error("Email, OTP, and new password are required");
      }
      const type = "forgetPassword";
      const storedOtpHash = await redisService.get(
        redisService.otp_key({ email, type }),
      );
      if (!storedOtpHash) {
        throw new Error("OTP expired or invalid");
      }

      if (!Compare({ plainText: otp, cipherText: storedOtpHash })) {
        throw new Error("Invalid OTP");
      }

      const hash = Hash({ plainText: newPassword });

      const user = await this._userModel.findOneAndUpdate({
        filter: { email },
        update: { password: hash, changeCredential: new Date() },
      });

      if (!user) throw new Error("User not found");

      await redisService.deleteKey(redisService.otp_key({ email, type }));
      await redisService.deleteKey(redisService.max_otp_key({ email, type }));

      successResponse({
        res,
        message: "Password reset successfully",
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { flag } = req.query;

      if (flag === "all") {
        (req as any).user.changeCredential = new Date();
        await (req as any).user.save();

        const pattern = `revoked::${(req as any).user._id}::*`;
        const userKeys = await redisService.keys(pattern);

        if (userKeys.length) {
          await this._userModel.deleteMany(userKeys);
        }
      } else {
        const ttl = (req as any).decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0) {
          return next(new Error("Token already expired"));
        }

        await redisService.setValue({
          key: redisService.revoked_key({
            userId: (req as any).user._id,
            jti: (req as any).decoded.jti,
          }),
          value: (req as any).decoded.jti,
          ttl,
        });
      }
      successResponse({ res, message: "Logged out successfully" });
    } catch (error) {
      throw new AppError(`Error in logout ${error}`, 500);
    }
  };

  uploadfile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError("file is required", 400));
    }

    const key = await this._s3Service.uploadFile({
      file: req.file,
      path: "users",
    });

    successResponse({ res, data: key });
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    const { ContentType, fileName } = req.body;
    const { url, key } = await this._s3Service.createPreSignedUrl({
      fileName,
      ContentType,
      path: `users/${(req as any).user._id}`,
    });
    (req as any).user.profilePic = key;
    await (req as any).user?.save();

    successResponse({ res, data: { url, key } });
  };

  uploadLargefile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError("file is required", 400));
    }

    const key = await this._s3Service.uploadLargeFile({
      file: req.file,
      path: "users/large",
    });
    successResponse({ res, data: key });
  };

  uploadfiles = async (req: Request, res: Response, next: NextFunction) => {
    const urls = await this._s3Service.uploadFiles({
      files: req.files as Express.Multer.File[],
      path: "users/Images",
    });

    successResponse({ res, data: urls });
  };

  softDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await this._userModel.findOneAndUpdate({
      filter: {
        _id: userId,
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
    if (!user) {
      throw new AppError("user not found");
    }
    return successResponse({
      res,
      message: "User soft deleted",
      data: user,
    });
  };

  hardDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const user = await this._userModel.findOne({
      filter: {
        _id: userId,
      },
    });
    if (!user) {
      throw new AppError("user not found");
    }
    await postModel.deleteMany({
      createdBy: new Types.ObjectId(userId as string),
    });
    await this._userModel.findOneAndDelete({
      filter: {
        _id: userId,
      },
    });

    return successResponse({
      res,
      message: "User hard deleted",
    });
  };
}

export default new UserService();
