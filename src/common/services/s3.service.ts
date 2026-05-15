import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { Store_enum } from "../enum/mutlter.enum.js";
import fs from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";
import {
  AWS_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_KEY,
} from "../../config/config.service.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../utilts/global-error-handler.js";

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: AWS_REGION!,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY!,
        secretAccessKey: AWS_SECRET_KEY!,
      },
    });
  }
  async uploadFile({
    store_type = Store_enum.memory,
    file,
    path = "General",
    ACL = ObjectCannedACL.private,
  }: {
    file: Express.Multer.File;
    path?: string;
    store_type?: Store_enum;
    ACL?: ObjectCannedACL;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      ACL,
      Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
      Body:
        store_type === Store_enum.memory
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });
    if (!command.input.Key) {
      throw new AppError("fail to upload file");
    }
    await this.client.send(command);
    return command.input.Key as string;
  }

  async uploadLargeFile({
    store_type = Store_enum.disk,
    file,
    path = "General",
    ACL = ObjectCannedACL.private,
  }: {
    file: Express.Multer.File;
    path?: string;
    store_type?: Store_enum;
    ACL?: ObjectCannedACL;
  }): Promise<string> {
    const command = new Upload({
      //lib storage
      client: this.client,
      params: {
        Bucket: AWS_BUCKET_NAME,
        ACL,
        Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
        Body:
          store_type === Store_enum.memory
            ? file.buffer
            : fs.createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });
    const result = await command.done();
    command.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });
    return result.Key as string;
  }
  async uploadFiles({
    store_type = Store_enum.memory,
    files,
    path = "General",
    ACL = ObjectCannedACL.private,
    isLarge = false,
  }: {
    files: Express.Multer.File[];
    path?: string;
    store_type?: Store_enum;
    ACL?: ObjectCannedACL;
    isLarge?: boolean;
  }) {
    let urls: string[] = [];
    if (isLarge) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadFile({ file, store_type, path, ACL });
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({ file, store_type, path, ACL });
        }),
      );
    }
    return urls;
  }
  async createPreSignedUrl({
    fileName,
    path,
    ContentType,
    expiresIn = 60,
  }: {
    fileName: string;
    path?: string;
    expiresIn?: number;
    ContentType?: string;
  }) {
    const key = `social_media_app/${path}/${randomUUID()}__${fileName}`;

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      ContentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, key };
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return await this.client.send(command);
  }

  async getFiles(folderName: string) {
    const command = new ListObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Prefix: `social_media_app/${folderName}`,
    });
    return await this.client.send(command);
  }

  async getPreSignedUrl({
    Key,
    download = "true",
    expiresIn = 60,
  }: {
    Key?: string;
    download?: string | undefined;
    expiresIn?: number;
  }) {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      // ResponseContentDisposition: download
      //   ? `attachment; filename=" ${Key.split("/").pop()}"`
      //   : undefined,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return url;
  }

  async deleteFile(Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteFiles(Keys: string[]) {
    const keyMapped = Keys.map((k) => {
      return { Key: k };
    });
    const command = new DeleteObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Delete: {
        Objects: keyMapped,
      },
    });
    return await this.client.send(command);
  }

  async deleteFolder(folderName: string) {
    const data = await this.getFiles(folderName);
    const keyMapped = data?.Contents?.map((k) => {
      return k.Key;
    });

    return await this.deleteFiles(keyMapped as string[]);
  }
}
