"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const mutlter_enum_js_1 = require("../enum/mutlter.enum.js");
const node_os_1 = require("node:os");
const multerCloud = ({ store_type = mutlter_enum_js_1.Store_enum.memory, custom_type = mutlter_enum_js_1.multer_enum.image, maxFileSize = 5 * 1024 * 1024, } = {}) => {
    const storage = store_type === mutlter_enum_js_1.Store_enum.memory
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: (0, node_os_1.tmpdir)(),
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + "__" + file.originalname);
            },
        });
    function fileFilter(req, file, cb) {
        if (!custom_type.includes(file.mimetype)) {
            return cb(new Error("Invalid file type"));
        }
        cb(null, true);
    }
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize },
    });
    return upload;
};
exports.default = multerCloud;
