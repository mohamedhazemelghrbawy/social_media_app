import nodemailer from "nodemailer";
import fs from "node:fs";
import { emailTemplate } from "./email.template.js";
import { EMAIL, PASSWORD } from "../../../config/config.service";
import Mail from "nodemailer/lib/mailer/index";
// import nodemailer from "nodemailer";
// import { EMAIL, PASSWORD } from "../../../../config/config.service.js";

export const sendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Mohamed" <${EMAIL}>`,
    ...mailOptions,
  });

  console.log("Message sent:", info.messageId);
};

export const generateOTP = async () => {
  return Math.floor(Math.random() * 900000 + 100000);
};
