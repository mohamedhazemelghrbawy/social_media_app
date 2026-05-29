"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const cors_1 = __importDefault(require("cors"));
const config_service_1 = require("./config/config.service");
const global_error_handler_1 = require("./common/utilts/global-error-handler");
const user_controller_1 = __importDefault(require("./modules/auth/user.controller"));
const connectionDB_1 = __importDefault(require("./DB/connectionDB"));
const redis_service_1 = __importDefault(require("./common/services/redis.service"));
const s3_service_1 = require("./common/services/s3.service");
const response_success_1 = require("./common/utilts/response.success");
const promises_1 = require("node:stream/promises");
const notification_service_1 = __importDefault(require("./common/services/notification.service"));
const post_controller_1 = __importDefault(require("./modules/posts/post.controller"));
const story_controller_1 = __importDefault(require("./modules/stories/story.controller"));
const graphql_schema_js_1 = require("./modules/graphql/graphql.schema.js");
const express_2 = require("graphql-http/lib/use/express");
const port = config_service_1.PORT;
const bootstrap = async () => {
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP , please try again later",
        handler: (req, res, next) => {
            // res.status(429).json({
            //   message: "too many requests from this IP , please try again later",
            // });
            throw new global_error_handler_1.AppError("too many requests from this IP , please try again later", 429);
        },
    });
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Welcome on social media app.......✅😊" });
    });
    // async function test() {
    //   const user = await userModel.insertMany([
    //     {
    //       firstName: "Mohamed",
    //       lastName: "Hazem",
    //       userName: "mohamed123",
    //       email: "test@test.com",
    //       password: "123456",
    //       age: 22,
    //       phone: "01000000000",
    //       address: "zag",
    //     },
    //   ]);
    //   console.log("user created");
    // }
    // async function test() {
    //   const user = await userModel.findOne({
    //     firstName: "Mohamed",
    //     paranoid: false,
    //   });
    //   console.log({ user });
    // }
    // test();
    app.use("/graphql", (0, express_2.createHandler)({ schema: graphql_schema_js_1.gql_schema, context: (req) => ({ req }) }));
    app.get("/send-notification", async (req, res, next) => {
        await notification_service_1.default.sentNotification({
            token: req.body.token,
            data: {
                title: "Hello",
                body: "Hiiiiiiii",
            },
        });
    });
    app.get("/upload/pre-signed/*path", async (req, res, next) => {
        const { path } = req.params;
        const { download } = req.query;
        const Key = path.join("/");
        const url = await new s3_service_1.S3Service().getPreSignedUrl({
            Key,
            // download: download ? download : undefined,
        });
        (0, response_success_1.successResponse)({ res, data: url });
    });
    app.get("/upload", async (req, res, next) => {
        const { folderName } = req.query;
        let result = await new s3_service_1.S3Service().getFiles(folderName);
        let resultMapped = result.Contents?.map((file) => {
            return file.Key;
        });
        (0, response_success_1.successResponse)({ res, data: resultMapped });
    });
    app.get("/delte-file", async (req, res, next) => {
        const { key } = req.query;
        let result = await new s3_service_1.S3Service().deleteFile(key);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/delte-files", async (req, res, next) => {
        const { keys } = req.query;
        let result = await new s3_service_1.S3Service().deleteFiles(keys);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/delte-folder", async (req, res, next) => {
        const { folderName } = req.query;
        let result = await new s3_service_1.S3Service().deleteFolder(folderName);
        (0, response_success_1.successResponse)({ res, data: result });
    });
    app.get("/upload/*path", async (req, res, next) => {
        const { path } = req.params;
        const { download } = req.query;
        const Key = path.join("/");
        const result = await new s3_service_1.S3Service().getFile(Key);
        const stream = result.Body;
        // console.log({ result:  });
        res.setHeader("Content-Type", result.ContentType);
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download && download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`);
        }
        await (0, promises_1.pipeline)(stream, res);
        (0, response_success_1.successResponse)({ res, data: Key });
    });
    (0, connectionDB_1.default)();
    await redis_service_1.default.connect();
    app.use("/auth", user_controller_1.default);
    app.use("/post", post_controller_1.default);
    app.use("/story", story_controller_1.default);
    app.use("{/*demo}", (req, res, next) => {
        // throw new Error(
        //   `Url ${req.originalUrl} with method ${req.method} not found`,
        //   { cause: 404 },
        // );
        throw new global_error_handler_1.AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
};
exports.default = bootstrap;
