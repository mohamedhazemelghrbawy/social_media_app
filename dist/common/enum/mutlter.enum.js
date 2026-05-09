"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store_enum = exports.multer_enum = void 0;
exports.multer_enum = {
    image: ["image/png", "image/jpng", "image/webp"],
    video: ["video/mp4"],
    pdf: ["application/pdf"],
};
var Store_enum;
(function (Store_enum) {
    Store_enum["disk"] = "disk";
    Store_enum["memory"] = "memory";
})(Store_enum || (exports.Store_enum = Store_enum = {}));
