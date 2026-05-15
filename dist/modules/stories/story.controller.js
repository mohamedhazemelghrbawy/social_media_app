"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const story_service_1 = __importDefault(require("./story.service"));
const authentication_js_1 = require("../../common/middleware/authentication.js");
const storyRouter = (0, express_1.Router)();
storyRouter.post("/creat-story", authentication_js_1.authentication, story_service_1.default.createStory);
storyRouter.get("/", authentication_js_1.authentication, story_service_1.default.getStories);
storyRouter.get("/:storyId", authentication_js_1.authentication, story_service_1.default.getStory);
storyRouter.patch("/soft-delete/:storyId", authentication_js_1.authentication, story_service_1.default.softDeleteStory);
storyRouter.delete("/delete/:storyId", authentication_js_1.authentication, story_service_1.default.hardDeleteStory);
exports.default = storyRouter;
