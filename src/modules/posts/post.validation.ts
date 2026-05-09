import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum.js";
import { Types } from "mongoose";
import { generalRules } from "../../common/utilts/generalRules.js";

export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      tags: z.array(generalRules.id).optional(),
      availability: z
        .enum(Availability_Enum)
        .default(Availability_Enum.friends),

      allowComment: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }
      if (args?.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Duplicate tags",
          });
        }
      }
    }),
};

export const likePostSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};

export const updatePostSchema = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      removeFiles: z.array(z.string()).optional(),
      removeTags: z.array(z.string()).optional(),
      allowComment: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
      tags: z.array(generalRules.id).optional(),
    })
    .superRefine((args, ctx) => {
      if (
        !args.content &&
        !args.attachments?.length &&
        !args.removeFiles?.length &&
        !args.tags?.length &&
        !args.removeTags?.length &&
        !args.allowComment &&
        !args.availability
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }
      if (args.tags?.length) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Duplicate tags",
          });
        }
      }
    }),
  params: likePostSchema.params,
};
