import * as z from "zod";
import { createCommentSchema } from "./comment.validaton.js";

export type createCommentDTO = z.infer<typeof createCommentSchema.body>;
