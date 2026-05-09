import { Router } from "express";
import storyService from "./story.service";
import { authentication } from "../../common/middleware/authentication.js";

const storyRouter = Router();

storyRouter.post("/creat-story", authentication, storyService.createStory);
storyRouter.get("/", authentication, storyService.getStories);
storyRouter.get("/:storyId", authentication, storyService.getStory);

storyRouter.patch(
  "/soft-delete/:storyId",
  authentication,
  storyService.softDeleteStory,
);
storyRouter.delete(
  "/delete/:storyId",
  authentication,
  storyService.hardDeleteStory,
);

export default storyRouter;
