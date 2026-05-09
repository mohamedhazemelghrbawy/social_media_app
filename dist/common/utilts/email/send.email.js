"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_service_1 = require("../../../config/config.service");
// import nodemailer from "nodemailer";
// import { EMAIL, PASSWORD } from "../../../../config/config.service.js";
const sendEmail = async (mailOptions) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        tls: {
            rejectUnauthorized: false,
        },
        auth: {
            user: config_service_1.EMAIL,
            pass: config_service_1.PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `"Mohamed" <${config_service_1.EMAIL}>`,
        ...mailOptions,
    });
    console.log("Message sent:", info.messageId);
};
exports.sendEmail = sendEmail;
const generateOTP = async () => {
    return Math.floor(Math.random() * 900000 + 100000);
};
exports.generateOTP = generateOTP;
