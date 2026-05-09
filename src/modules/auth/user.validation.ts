import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const signUpSchema = {
  body: z
    .object({
      userName: z
        .string({ error: "Name is required" })
        .min(3, "Name must be at least 3 characters long")
        .max(25),
      email: z.string().email("Invalid email address"),
      password: z
        .string()
        .min(6, "password must be at least 6 characters long"),
      cPassword: z
        .string()
        .min(6, "password must be at least 6 characters long"),
      age: z.number().min(18).max(60),
      gebder: z.enum(GenderEnum).optional(),
      address: z.string().min(3).max(40).optional(),
      phone: z.string().min(8).max(13).optional(),
    })
    .refine(
      (data) => {
        return data.password == data.cPassword;
      },
      {
        message: "passwords do not match",
        path: ["cPassword"],
      },
    ),
};

export const logInSchema = {
  body: z
    .object({
      email: z.string().email("Invalid email address"),
      password: z
        .string()
        .min(6, "password must be at least 6 characters long"),
      fcm: z.string(),
    })
    .required(),
};

export const confirmEmailSchmea = {
  body: z
    .object({
      email: z.string().email("Invalid email address"),
      otp: z.string().length(6),
    })
    .required(),
};
