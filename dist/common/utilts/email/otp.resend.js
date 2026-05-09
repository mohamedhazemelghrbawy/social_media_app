"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = void 0;
const redis_service_js_1 = __importDefault(require("../../services/redis.service.js"));
const hash_security_js_1 = require("../security/hash.security.js");
const email_template_js_1 = require("./email.template.js");
const send_email_js_1 = require("./send.email.js");
const sendOtp = async ({ email, userName, message, type, }) => {
    const isBlocked = await redis_service_js_1.default.ttlTimer(redis_service_js_1.default.block_otp_key({ email, type }));
    if (isBlocked > 0) {
        throw new Error(`you have executed the maximum number of tries , please try again after ${isBlocked} seconds `);
    }
    const ttl = await redis_service_js_1.default.ttlTimer(redis_service_js_1.default.otp_key({ email, type }));
    if (ttl > 0) {
        throw new Error(`you can resend otp after ${ttl} seconds`);
    }
    let maxOtp = (await redis_service_js_1.default.get(redis_service_js_1.default.max_otp_key({ email, type }))) || 0;
    if (maxOtp == 1) {
        await redis_service_js_1.default.setValue({
            key: redis_service_js_1.default.max_otp_key({ email, type }),
            value: maxOtp,
            ttl: 60 * 5,
        });
    }
    if (maxOtp >= 3) {
        await redis_service_js_1.default.setValue({
            key: redis_service_js_1.default.block_otp_key({ email, type }),
            value: 1,
            ttl: 60 * 5,
        });
        throw new Error("you have executed the maximum number of tries");
    }
    const otp = await (0, send_email_js_1.generateOTP)();
    // eventEmitter.emit("confirmEmail", async () => {
    await (0, send_email_js_1.sendEmail)({
        to: email,
        subject: "Welcome to Sara7a App",
        html: (0, email_template_js_1.emailTemplate)(userName, otp, message),
    });
    await redis_service_js_1.default.setValue({
        key: redis_service_js_1.default.otp_key({ email, type }),
        value: (0, hash_security_js_1.Hash)({ plainText: `${otp}` }),
        ttl: 60,
    });
    await redis_service_js_1.default.incr(redis_service_js_1.default.max_otp_key({ email, type }));
    return otp;
    // });
};
exports.sendOtp = sendOtp;
