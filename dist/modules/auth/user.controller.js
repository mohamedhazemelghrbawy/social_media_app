"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const validation_1 = require("../../common/middleware/validation");
const userValidation = __importStar(require("./user.validation"));
const authentication_js_1 = require("../../common/middleware/authentication.js");
const multer_cloud_js_1 = __importDefault(require("../../common/middleware/multer.cloud.js"));
const mutlter_enum_js_1 = require("../../common/enum/mutlter.enum.js");
const authRouter = (0, express_1.Router)();
authRouter.post("/signup", (0, validation_1.validation)(userValidation.signUpSchema), user_service_1.default.signUp);
authRouter.post("/comfirm-email", (0, validation_1.validation)(userValidation.confirmEmailSchmea), user_service_1.default.confirmedEmail);
authRouter.patch("/resent-otp", user_service_1.default.resendConfirmOtp);
authRouter.post("/signup-with-gmail", user_service_1.default.signUpWithGmail);
authRouter.post("/signin", (0, validation_1.validation)(userValidation.logInSchema), user_service_1.default.signIn);
authRouter.patch("/update-password", authentication_js_1.authentication, user_service_1.default.updatePassword);
authRouter.post("/send-otp-forget-password", user_service_1.default.sendForgetOtp);
authRouter.post("/forget-password", user_service_1.default.forgetPassword);
authRouter.post("/logout", authentication_js_1.authentication, user_service_1.default.logout);
authRouter.post("/upload-file", (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.disk }).single("attachment"), user_service_1.default.uploadfile);
authRouter.post("/upload-large-file", (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.disk }).single("attachment"), user_service_1.default.uploadLargefile);
authRouter.post("/upload-large-file", (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.disk }).single("attachment"), user_service_1.default.uploadLargefile);
authRouter.post("/upload-files", (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.disk }).array("attachments"), user_service_1.default.uploadfiles);
authRouter.post("/upload", authentication_js_1.authentication, 
// multerCloud({ store_type: Store_enum.disk }).single("attachment"),
user_service_1.default.upload);
authRouter.patch("/delete/:userId", authentication_js_1.authentication, user_service_1.default.softDeleteUser);
authRouter.delete("/delete/:userId", authentication_js_1.authentication, user_service_1.default.softDeleteUser);
exports.default = authRouter;
