"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class NotificationService {
    client;
    constructor() {
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, "../../../src/config/social-app-5fa50-firebase-adminsdk-fbsvc-4459bdc445.json")));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    async sentNotification({ token, data, }) {
        const message = {
            token,
            data,
        };
        return await this.client.messaging().send(message);
    }
    async sentNotifications({ tokens, data, }) {
        await Promise.all(tokens.map((token) => {
            return this.sentNotification({ token, data });
        }));
    }
}
exports.default = new NotificationService();
