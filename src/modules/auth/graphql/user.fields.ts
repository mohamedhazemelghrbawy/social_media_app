import { AppCheck } from "firebase-admin/app-check";
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { AppError } from "../../../common/utilts/global-error-handler.js";
import { userType } from "./user.type.js";
import { createUserArgs, getUserArgs } from "./user.args.js";
import userService from "../user.service.js";
import { authentication_gql } from "../../../common/middleware/authentication.js";
import {
  authorization,
  authorization_gql,
} from "../../../common/middleware/authorization.js";
import { getUserSchema } from "../user.validation.js";
import { Validation_GQL } from "../../../common/middleware/validation.js";

export class UserFields {
  constructor() {}

  query = () => {
    return {
      getUsers: {
        type: userType,
        args: getUserArgs,
        resolve: (parent: any, args: any, context: any) => {
          return userService.getUsers();
        },
      },
      listUsers: {
        type: new GraphQLList(userType),
        resolve: async (parent: any, args: any, context: any) => {
          const { user, decoded } = await authentication_gql(
            context.req.headers.authorization,
          );
          return await userService.getUsers();
        },
      },
      getUser: {
        type: userType,
        args: { token: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: async (parent: any, args: any, context: any) => {
          await Validation_GQL(getUserSchema, args);

          const { user } = await authentication_gql(args.token);

          await authorization_gql(["user"], user?.role!);

          return userService.getUserById(user._id);
        },
      },
    };
  };
  mutation = () => {
    return {
      // createUser: {
      //   type: new GraphQLList(userType),
      //   args: createUserArgs,
      //   resolve: (parent: any, args: any) => {
      //     const { id, name, age } = args;
      //     const userExist = users.find((user) => user.id == id);
      //     if (userExist) {
      //       throw new AppError("user already exist");
      //     }
      //     users.push({ id, name, age });
      //     return users;
      //   },
      // },
    };
  };
}

export default new UserFields();
