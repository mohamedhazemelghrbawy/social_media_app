"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const node_crypto_1 = require("node:crypto");
const mutlter_enum_js_1 = require("../enum/mutlter.enum.js");
const node_fs_1 = __importDefault(require("node:fs"));
const lib_storage_1 = require("@aws-sdk/lib-storage");
const config_service_js_1 = require("../../config/config.service.js");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_js_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_js_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_js_1.AWS_SECRET_KEY,
            },
        });
    }
    async uploadFile({ store_type = mutlter_enum_js_1.Store_enum.memory, file, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            Body: store_type === mutlter_enum_js_1.Store_enum.memory
                ? file.buffer
                : node_fs_1.default.createReadStream(file.path),
            ContentType: file.mimetype,
        });
        await this.client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ store_type = mutlter_enum_js_1.Store_enum.disk, file, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: config_service_js_1.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: store_type === mutlter_enum_js_1.Store_enum.memory
                    ? file.buffer
                    : node_fs_1.default.createReadStream(file.path),
                ContentType: file.mimetype,
            },
        });
        const result = await command.done();
        return result.Key;
    }
    async uploadFiles({ store_type = mutlter_enum_js_1.Store_enum.memory, files, path = "General", ACL = client_s3_1.ObjectCannedACL.private, isLarge = false, }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, store_type, path, ACL });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, store_type, path, ACL });
            }));
        }
        return urls;
    }
    async createPreSignedUrl({ fileName, path, ContentType, expiresIn = 60, }) {
        const key = `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Key: key,
            ContentType,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key };
    }
    async getFile(Key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Key,
        });
        return await this.client.send(command);
    }
    async getFiles(folderName) {
        const command = new client_s3_1.ListObjectsCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Prefix: `social_media_app/${folderName}`,
        });
        return await this.client.send(command);
    }
    async getPreSignedUrl({ Key, download = "true", expiresIn = 60, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Key,
            // ResponseContentDisposition: download
            //   ? `attachment; filename=" ${Key.split("/").pop()}"`
            //   : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
    async deleteFile(Key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteFiles(Keys) {
        const keyMapped = Keys.map((k) => {
            return { Key: k };
        });
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket: config_service_js_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keyMapped,
            },
        });
        return await this.client.send(command);
    }
    async deleteFolder(folderName) {
        const data = await this.getFiles(folderName);
        const keyMapped = data?.Contents?.map((k) => {
            return k.Key;
        });
        return await this.deleteFiles(keyMapped);
    }
}
exports.S3Service = S3Service;
