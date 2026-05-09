import RedisService from "../../services/redis.service.js";
import { Hash } from "../security/hash.security.js";
import { eventEmitter } from "./email.event.js";
import { emailTemplate } from "./email.template.js";
import { generateOTP, sendEmail } from "./send.email.js";

export const sendOtp = async ({
  email,
  userName,
  message,
  type,
}: {
  email: string;
  userName: string;
  message: string;
  type: string;
}) => {
  const isBlocked = await RedisService.ttlTimer(
    RedisService.block_otp_key({ email, type }),
  );
  if (isBlocked > 0) {
    throw new Error(
      `you have executed the maximum number of tries , please try again after ${isBlocked} seconds `,
    );
  }

  const ttl = await RedisService.ttlTimer(
    RedisService.otp_key({ email, type }),
  );
  if (ttl > 0) {
    throw new Error(`you can resend otp after ${ttl} seconds`);
  }

  let maxOtp =
    (await RedisService.get(RedisService.max_otp_key({ email, type }))) || 0;

  if (maxOtp == 1) {
    await RedisService.setValue({
      key: RedisService.max_otp_key({ email, type }),
      value: maxOtp,
      ttl: 60 * 5,
    });
  }

  if (maxOtp >= 3) {
    await RedisService.setValue({
      key: RedisService.block_otp_key({ email, type }),
      value: 1,
      ttl: 60 * 5,
    });

    throw new Error("you have executed the maximum number of tries");
  }

  const otp = await generateOTP();

  // eventEmitter.emit("confirmEmail", async () => {
  await sendEmail({
    to: email,
    subject: "Welcome to Sara7a App",
    html: emailTemplate(userName, otp, message),
  });
  await RedisService.setValue({
    key: RedisService.otp_key({ email, type }),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60,
  });

  await RedisService.incr(RedisService.max_otp_key({ email, type }));
  return otp;
  // });
};
