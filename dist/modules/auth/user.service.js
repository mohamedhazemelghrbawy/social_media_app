"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_enum_1 = require("../../common/enum/user.enum");
const global_error_handler_1 = require("../../common/utilts/global-error-handler");
const response_success_1 = require("../../common/utilts/response.success");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const encrypt_security_1 = require("../../common/utilts/security/encrypt.security");
const hash_security_1 = require("../../common/utilts/security/hash.security");
const send_email_1 = require("../../common/utilts/email/send.email");
const email_template_1 = require("../../common/utilts/email/email.template");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const crypto_1 = require("crypto");
const token_service_1 = require("../../common/utilts/token.service");
const config_service_1 = require("../../config/config.service");
const s3_service_1 = require("../../common/services/s3.service");
const otp_resend_1 = require("../../common/utilts/email/otp.resend");
const google_auth_library_1 = require("google-auth-library");
// import NotificationService from "../../common/services/notification.service";
const post_model_js_1 = __importDefault(require("../../DB/models/post.model.js"));
const post_repository_js_1 = __importDefault(require("../../DB/repository/post.repository.js"));
const mongoose_1 = require("mongoose");
const comment_model_js_1 = __importDefault(require("../../DB/models/comment.model.js"));
const story_model_js_1 = __importDefault(require("../../DB/models/story.model.js"));
// import { emit } from "cluster";
class UserService {
    _userModel = new user_repository_1.default();
    _postRepo = new post_repository_js_1.default();
    _s3Service = new s3_service_1.S3Service();
    // private readonly _notificationService = NotificationService;
    constructor() { }
    signUp = async (req, res, next) => {
        let { userName, email, password, cPassword, phone, address, age, gender } = req.body;
        await this._userModel.checkUser(email);
        const user = await this._userModel.create({
            userName,
            email,
            password: (0, hash_security_1.Hash)({ plainText: password }),
            phone: phone ? (0, encrypt_security_1.encrypt)(phone) : null,
            address,
            age,
            gender,
        });
        console.log(3);
        const otp = await (0, send_email_1.generateOTP)();
        const type = "signupOtp";
        await (0, send_email_1.sendEmail)({
            to: email,
            subject: "Email Confirmation",
            html: (0, email_template_1.emailTemplate)(userName, otp, "Welcome to social media app"),
        });
        await redis_service_1.default.setValue({
            key: redis_service_1.default.otp_key({ email, type }),
            value: (0, hash_security_1.Hash)({ plainText: `${otp}` }),
            ttl: 60 * 4,
        });
        await redis_service_1.default.setValue({
            key: redis_service_1.default.max_otp_key({ email, type }),
            value: 1,
            ttl: 60 * 30,
        });
        // });
        await redis_service_1.default.setValue({
            key: redis_service_1.default.otp_key({ email, type }),
            value: (0, hash_security_1.Hash)({ plainText: `${otp}` }),
            ttl: 60 * 4,
        });
        console.log(9);
        (0, response_success_1.successResponse)({
            res,
            status: 201,
            message: "Signup successful",
            data: user,
        });
    };
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            // audience: GOOGLE_CLIENT_ID as string,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new global_error_handler_1.AppError("Invalid Google token", 401);
        }
        const { email, email_verified, name } = payload;
        if (!email || !email_verified) {
            throw new global_error_handler_1.AppError("Google account not verified", 401);
        }
        let user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user) {
            user = await this._userModel.create({
                email,
                confirmed: email_verified,
                userName: name,
                provider: user_enum_1.ProviderEnum.google,
            });
        }
        if (user.provider == user_enum_1.ProviderEnum.system) {
            throw new global_error_handler_1.AppError("please");
        }
        const access_token = (0, token_service_1.generateToken)({
            payload: { id: user._id, email: user.email },
            secret_key: config_service_1.SECRET_KEY,
            options: { expiresIn: "1h" },
        });
        (0, response_success_1.successResponse)({
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
    confirmedEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpExist = await redis_service_1.default.get(redis_service_1.default.otp_key({ email, type: "signupOtp" }));
        if (!otpExist) {
            throw new Error("otp exired or incorrect");
        }
        const userr = await this._userModel.findOne({ filter: { email } });
        if (!userr)
            throw new Error("user not found");
        if (userr.confirmed) {
            throw new Error("Account already confirmed");
        }
        if (userr.provider !== user_enum_1.ProviderEnum.system) {
            if (!(0, hash_security_1.Compare)({ plainText: otp, cipherText: otpExist })) {
                throw new Error("Invalid otp");
            }
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: {
                email,
                confirmed: false,
                provider: user_enum_1.ProviderEnum.system,
            },
            update: { confirmed: true },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not exist");
        }
        await redis_service_1.default.deleteKey(redis_service_1.default.otp_key({ email, type: "signupOtp" }));
        (0, response_success_1.successResponse)({
            res,
            message: "confirmed done",
        });
    };
    resendConfirmOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                provider: user_enum_1.ProviderEnum.system,
            },
        });
        if (!user || user.confirmed) {
            throw new Error("user not exist or already confirmed");
        }
        await (0, otp_resend_1.sendOtp)({
            email,
            userName: user.userName,
            message: "welcome to social media app your otp is",
            type: "confirmedEmail",
        });
        // await deleteKey(otp_key({ email }));
        // await deleteKey(max_otp_key({ email }));
        // await deleteKey(block_otp_key({ email }));
        (0, response_success_1.successResponse)({ res, message: "OTP resent successfully" });
    };
    signIn = async (req, res, next) => {
        let { email, password, fcm } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handler_1.AppError("Email is not exist");
        }
        const blockedTime = await redis_service_1.default.ttlTimer(redis_service_1.default.block_password_key({ email }));
        if (!(0, hash_security_1.Compare)({ plainText: password, cipherText: user.password })) {
            if (blockedTime > 0) {
                throw new Error(`you have executed the maximum number of tries , please try again after ${blockedTime} seconds`);
            }
            let maxPass = Number(await redis_service_1.default.get(redis_service_1.default.max_password_key({ email }))) || 0;
            if (maxPass >= 5) {
                await redis_service_1.default.setValue({
                    key: redis_service_1.default.block_password_key({ email }),
                    value: 1,
                    ttl: 60 * 5,
                });
                throw new Error("you have executed the maximum number of tries");
            }
            await redis_service_1.default.setValue({
                key: redis_service_1.default.max_password_key({ email }),
                value: maxPass + 1,
                ttl: 60 * 5,
            });
            throw new global_error_handler_1.AppError("Invalid password");
        }
        const jwtid = (0, crypto_1.randomUUID)();
        const access_token = (0, token_service_1.generateToken)({
            payload: { id: user._id, email: user.email },
            secret_key: config_service_1.SECRET_KEY,
            options: { expiresIn: 60 * 20, jwtid },
        });
        const refresh_token = (0, token_service_1.generateToken)({
            payload: { id: user._id, email: user.email },
            secret_key: config_service_1.REFRESH_SECRET_KEY,
            options: { expiresIn: "1y", jwtid },
        });
        // if (fcm) {
        //   await redisService.addFCM({ userId: user._id, FCMToken: fcm });
        //   const tokens = await redisService.getFCMs(user._id);
        //   await this._notificationService.sentNotifications({
        //     tokens,
        //     data: {
        //       title: `hi ${user.firstName}`,
        //       body: `new login at ${new Date()}`,
        //     },
        //   });
        // }
        // await redisService.deleteKey(redisService.max_password_key({ email }));
        // await redisService.deleteKey(redisService.block_password_key({ email }));
        (0, response_success_1.successResponse)({
            res,
            message: "user signed in successfully",
            data: {
                user,
                access_token,
                refresh_token,
            },
        });
    };
    updatePassword = async (req, res, next) => {
        let { oldPassword, newPassword } = req.body;
        if (!(0, hash_security_1.Compare)({
            plainText: oldPassword,
            cipherText: req.user.password,
        })) {
            throw new Error("invalid old password");
        }
        const hash = (0, hash_security_1.Hash)({ plainText: newPassword });
        req.user.password = hash;
        req.user.changeCredential = new Date();
        await req.user.save();
        (0, response_success_1.successResponse)({
            res,
            message: "done",
        });
    };
    sendForgetOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user)
            throw new Error("User not found");
        const type = "forgetPassword";
        await (0, otp_resend_1.sendOtp)({
            email,
            userName: user.userName,
            message: "to reset password is",
            type,
        });
        // await deleteKey(otp_key({ email, type }));
        // await deleteKey(max_otp_key({ email, type }));
        // await deleteKey(block_otp_key({ email, type }));
        (0, response_success_1.successResponse)({
            res,
            message: "OTP sent successfully",
        });
    };
    forgetPassword = async (req, res, next) => {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) {
                throw new Error("Email, OTP, and new password are required");
            }
            const type = "forgetPassword";
            const storedOtpHash = await redis_service_1.default.get(redis_service_1.default.otp_key({ email, type }));
            if (!storedOtpHash) {
                throw new Error("OTP expired or invalid");
            }
            if (!(0, hash_security_1.Compare)({ plainText: otp, cipherText: storedOtpHash })) {
                throw new Error("Invalid OTP");
            }
            const hash = (0, hash_security_1.Hash)({ plainText: newPassword });
            const user = await this._userModel.findOneAndUpdate({
                filter: { email },
                update: { password: hash, changeCredential: new Date() },
            });
            if (!user)
                throw new Error("User not found");
            await redis_service_1.default.deleteKey(redis_service_1.default.otp_key({ email, type }));
            await redis_service_1.default.deleteKey(redis_service_1.default.max_otp_key({ email, type }));
            (0, response_success_1.successResponse)({
                res,
                message: "Password reset successfully",
            });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const { flag } = req.query;
            if (flag === "all") {
                req.user.changeCredential = new Date();
                await req.user.save();
                const pattern = `revoked::${req.user._id}::*`;
                const userKeys = await redis_service_1.default.keys(pattern);
                if (userKeys.length) {
                    await this._userModel.deleteMany(userKeys);
                }
            }
            else {
                const ttl = req.decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl <= 0) {
                    return next(new Error("Token already expired"));
                }
                await redis_service_1.default.setValue({
                    key: redis_service_1.default.revoked_key({
                        userId: req.user._id,
                        jti: req.decoded.jti,
                    }),
                    value: req.decoded.jti,
                    ttl,
                });
            }
            (0, response_success_1.successResponse)({ res, message: "Logged out successfully" });
        }
        catch (error) {
            throw new global_error_handler_1.AppError(`Error in logout ${error}`, 500);
        }
    };
    uploadfile = async (req, res, next) => {
        if (!req.file) {
            throw new global_error_handler_1.AppError("file is required");
        }
        const key = await this._s3Service.uploadFile({
            file: req.file,
            path: "users",
        });
        (0, response_success_1.successResponse)({ res, data: key });
    };
    uploadLargefile = async (req, res, next) => {
        if (!req.file) {
            return next(new global_error_handler_1.AppError("file is required", 400));
        }
        const key = await this._s3Service.uploadLargeFile({
            file: req.file,
            path: "users/large",
        });
        (0, response_success_1.successResponse)({ res, data: key });
    };
    uploadfiles = async (req, res, next) => {
        const urls = await this._s3Service.uploadFiles({
            files: req.files,
            path: "users/files",
        });
        (0, response_success_1.successResponse)({ res, data: urls });
    };
    upload = async (req, res, next) => {
        const { ContentType, fileName } = req.body;
        const { url, key } = await this._s3Service.createPreSignedUrl({
            fileName,
            ContentType,
            path: `users/${req.user?._id}`,
        });
        // (req as any).user.profilePic = key;
        await this._userModel.findOneAndUpdate({
            filter: { _id: req?.user?._id },
            update: { profilePic: key },
        });
        await req.user?.save();
        (0, response_success_1.successResponse)({ res, data: { url, key } });
    };
    softDeleteUser = async (req, res, next) => {
        const { userId } = req.params;
        const user = await this._userModel.findOneAndUpdate({
            filter: {
                _id: userId,
                deletedAt: null,
            },
            update: {
                deletedAt: new Date(),
                deletedBy: req.user._id,
                isDeleted: true,
            },
            options: {
                new: true,
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not found or already deleted");
        }
        return (0, response_success_1.successResponse)({
            res,
            message: "User soft deleted",
            data: user,
        });
    };
    hardDeleteUser = async (req, res, next) => {
        const { userId } = req.params;
        const user = await this._userModel.findOne({
            filter: { _id: userId },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not found");
        }
        const id = new mongoose_1.Types.ObjectId(userId);
        await post_model_js_1.default.deleteMany({ createdBy: id });
        await comment_model_js_1.default.deleteMany({ createdBy: id });
        await story_model_js_1.default.deleteMany({ createdBy: id });
        await this._userModel.findOneAndDelete({
            filter: { _id: id },
        });
        return (0, response_success_1.successResponse)({
            res,
            message: "User permanently deleted",
        });
    };
}
exports.default = new UserService();
