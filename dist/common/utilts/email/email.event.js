"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const node_events_1 = require("node:events");
exports.eventEmitter = new node_events_1.EventEmitter();
exports.eventEmitter.on("confirmEmail", async (fn) => {
    await fn();
});
