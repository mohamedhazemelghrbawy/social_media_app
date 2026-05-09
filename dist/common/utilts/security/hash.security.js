"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash = Hash;
exports.Compare = Compare;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
function Hash({ plainText, salt_rounds = config_service_1.SALT_ROUNDS, }) {
    return (0, bcrypt_1.hashSync)(plainText.toString(), Number(salt_rounds));
}
function Compare({ plainText, cipherText, }) {
    return (0, bcrypt_1.compareSync)(plainText, cipherText);
}
