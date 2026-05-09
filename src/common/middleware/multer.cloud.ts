import multer from "multer";
import { multer_enum, Store_enum } from "../enum/mutlter.enum.js";
import { tmpdir } from "node:os";
import { Request } from "express";
const multerCloud = ({
  store_type = Store_enum.memory,
  custom_type = multer_enum.image,
  maxFileSize = 5 * 1024 * 1024,
}: {
  store_type?: Store_enum;
  custom_type?: string[];
  maxFileSize?: number;
} = {}) => {
  const storage =
    store_type === Store_enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "__" + file.originalname);
          },
        });
  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!custom_type.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
  return upload;
};

export default multerCloud;
