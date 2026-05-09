import * as z from "zod";
import { createPostSchema, updatePostSchema } from "./post.validation.js";

export type createPostDTO = z.infer<typeof createPostSchema.body>;
export type updatePostDTO = z.infer<typeof updatePostSchema.body>;
