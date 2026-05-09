"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostAvailability = void 0;
const post_enum_1 = require("../../common/enum/post.enum");
const PostAvailability = (req) => {
    return {
        $or: [
            {
                availability: post_enum_1.Availability_Enum.public,
            },
            {
                availability: post_enum_1.Availability_Enum.only_me,
                createdBy: req.user._id,
            },
            {
                availability: post_enum_1.Availability_Enum.friends,
                createdBy: {
                    $in: [...req.user.friends, req.user._id],
                },
            },
            {
                tags: {
                    $in: [req.user._id],
                },
            },
        ],
    };
};
exports.PostAvailability = PostAvailability;
