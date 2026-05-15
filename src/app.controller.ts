import express from "express";
import type { Request, Response, NextFunction } from "express";
const app: express.Application = express();
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { PORT } from "./config/config.service";
import {
  AppError,
  globalErrorHandler,
} from "./common/utilts/global-error-handler";
import authRouter from "./modules/auth/user.controller";

import checkConnectionDB from "./DB/connectionDB";
import RedisClient from "@redis/client/dist/lib/client/index";
import redisService from "./common/services/redis.service";
import userModel from "./DB/models/user.model";
import { S3Service } from "./common/services/s3.service";
import { successResponse } from "./common/utilts/response.success";
import { redisConnection } from "./DB/redis/redis.db";
import { pipeline } from "node:stream/promises";
import { resolveRuntimeExtensions } from "@aws-sdk/client-s3/dist-types/runtimeExtensions";
import notificationService from "./common/services/notification.service";
import postRouter from "./modules/posts/post.controller";
import storyRouter from "./modules/stories/story.controller";
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";

const port = PORT;
const bootstrap = async () => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP , please try again later",
    handler: (req: Request, res: Response, next: NextFunction) => {
      // res.status(429).json({
      //   message: "too many requests from this IP , please try again later",
      // });
      throw new AppError(
        "too many requests from this IP , please try again later",
        429,
      );
    },
  });

  app.use(express.json());
  app.use(cors(), helmet(), limiter);

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
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

  const users = [
    { id: 1, name: "Mohamed", age: 20 },
    { id: 1, name: "Ahmed", age: 30 },
    { id: 1, name: "Khaled", age: 25 },
  ];

  const userType = new GraphQLObjectType({
    name: "getUser",
    fields: {
      id: { type: GraphQLInt },
      name: { type: GraphQLString },
      age: { type: GraphQLInt },
    },
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "RootQueryType",
      description: "query",
      fields: {
        // hello: {
        //   type: GraphQLString,
        //   resolve: () => {
        //     return "Hello World";
        //   },
        // },
        getUser: {
          type: userType,
          args: {
            name: { type: new GraphQLNonNull(GraphQLString) },
          },
          resolve: (parent, args) => {
            return users.find((user) => user.name == args.name);
          },
        },
        listUsers: {
          type: new GraphQLList(userType),
          resolve: () => {
            return users;
          },
        },
      },
    }),
  });

  app.use("/graphql", createHandler({ schema }));

  app.get(
    "/send-notification",
    async (req: Request, res: Response, next: NextFunction) => {
      await notificationService.sentNotification({
        token: req.body.token,
        data: {
          title: "Hello",
          body: "Hiiiiiiii",
        },
      });
    },
  );

  app.get(
    "/upload/pre-signed/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as { path: string[] };
      const { download } = req.query as { download: string };
      const Key = path.join("/") as string;
      const url = await new S3Service().getPreSignedUrl({
        Key,
        // download: download ? download : undefined,
      });

      successResponse({ res, data: url });
    },
  );

  app.get(
    "/upload",
    async (req: Request, res: Response, next: NextFunction) => {
      const { folderName } = req.query as { folderName: string };

      let result = await new S3Service().getFiles(folderName);
      let resultMapped = result.Contents?.map((file) => {
        return file.Key;
      });

      successResponse({ res, data: resultMapped });
    },
  );

  app.get(
    "/delte-file",
    async (req: Request, res: Response, next: NextFunction) => {
      const { key } = req.query as { key: string };

      let result = await new S3Service().deleteFile(key);

      successResponse({ res, data: result });
    },
  );

  app.get(
    "/delte-files",
    async (req: Request, res: Response, next: NextFunction) => {
      const { keys } = req.query as { keys: string[] };

      let result = await new S3Service().deleteFiles(keys);

      successResponse({ res, data: result });
    },
  );

  app.get(
    "/delte-folder",
    async (req: Request, res: Response, next: NextFunction) => {
      const { folderName } = req.query as { folderName: string };

      let result = await new S3Service().deleteFolder(folderName);

      successResponse({ res, data: result });
    },
  );

  app.get(
    "/upload/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as { path: string[] };
      const { download } = req.query;
      const Key = path.join("/") as string;
      const result = await new S3Service().getFile(Key);
      const stream = result.Body as NodeJS.ReadableStream;
      // console.log({ result:  });
      res.setHeader("Content-Type", result.ContentType!);
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      if (download && download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${path.pop()}"`,
        );
      }

      await pipeline(stream, res);
      successResponse({ res, data: Key });
    },
  );

  checkConnectionDB();
  await redisService.connect();

  app.use("/auth", authRouter);
  app.use("/post", postRouter);
  app.use("/story", storyRouter);
  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    // throw new Error(
    //   `Url ${req.originalUrl} with method ${req.method} not found`,
    //   { cause: 404 },
    // );
    throw new AppError(
      `Url ${req.originalUrl} with method ${req.method} not found`,
      404,
    );
  });
  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};
export default bootstrap;
