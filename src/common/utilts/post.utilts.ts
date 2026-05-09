import { Request } from "express";
import { Availability_Enum } from "../../common/enum/post.enum";

export const PostAvailability = (req: Request) => {
  return {
    $or: [
      {
        availability: Availability_Enum.public,
      },

      {
        availability: Availability_Enum.only_me,
        createdBy: req.user!._id,
      },

      {
        availability: Availability_Enum.friends,
        createdBy: {
          $in: [...req.user!.friends, req.user!._id],
        },
      },

      {
        tags: {
          $in: [req.user!._id],
        },
      },
    ],
  };
};
