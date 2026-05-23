import { Request, Response, NextFunction } from "express";

import { ZodType } from "zod";
import { AppError } from "../utilts/global-error-handler";
import { GraphQLError } from "graphql";

type reqType = keyof Request;

type SchemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationError = [];
    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue;
      if (req?.file) {
        req.body.attachment = req.file;
      }
      if (req?.files) {
        req.body.attachments = req.files;
      }
      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        validationError.push(result.error.message);
        // throw new AppError(result.error.message, 400);
      }
    }
    if (validationError.length > 0) {
      throw new AppError(JSON.parse(validationError as unknown as string), 400);
    }
    return next();
  };
};
export const Validation_GQL = async (schema: ZodType, data: any) => {
  const errorValidation = [];

  const result = await schema.safeParseAsync(data);

  if (!result?.success) {
    const errors = result.error.issues.map((err: any) => {
      return {
        path: err.path[0],
        message: err.message,
      };
    });
    errorValidation.push(...errors);
  }

  if (errorValidation.length) {
    throw new GraphQLError("Validation failed", {
      extensions: {
        code: "BAD_REQUEST",
        status: 400,
        errors: errorValidation,
      },
    });
  }
};
