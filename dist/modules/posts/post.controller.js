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
const post_service_1 = __importDefault(require("./post.service"));
const postValidation = __importStar(require("./post.validation"));
const authentication_1 = require("../../common/middleware/authentication");
const multer_cloud_js_1 = __importDefault(require("../../common/middleware/multer.cloud.js"));
const validation_js_1 = require("../../common/middleware/validation.js");
const mutlter_enum_js_1 = require("../../common/enum/mutlter.enum.js");
const postRouter = (0, express_1.Router)();
postRouter.post("/", authentication_1.authentication, (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.memory }).array("attachments"), (0, validation_js_1.validation)(postValidation.createPostSchema), post_service_1.default.createPost);
postRouter.post("/:postId", authentication_1.authentication, (0, multer_cloud_js_1.default)({ store_type: mutlter_enum_js_1.Store_enum.memory }).array("attachments"), (0, validation_js_1.validation)(postValidation.updatePostSchema), post_service_1.default.updatePost);
postRouter.post("/:postId/like", authentication_1.authentication, (0, validation_js_1.validation)(postValidation.likePostSchema), post_service_1.default.likePost);
postRouter.get("/", authentication_1.authentication, post_service_1.default.getPosts);
postRouter.get("/post/:postId", authentication_1.authentication, post_service_1.default.getPost);
postRouter.patch("/delete/:postId", authentication_1.authentication, post_service_1.default.softDeletePost);
postRouter.delete("/delete/:postId", authentication_1.authentication, post_service_1.default.hardDeletePost);
exports.default = postRouter;
