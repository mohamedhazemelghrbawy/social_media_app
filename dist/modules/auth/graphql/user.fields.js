"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFields = void 0;
const graphql_1 = require("graphql");
const user_type_js_1 = require("./user.type.js");
const user_args_js_1 = require("./user.args.js");
const user_service_js_1 = __importDefault(require("../user.service.js"));
const authentication_js_1 = require("../../../common/middleware/authentication.js");
const authorization_js_1 = require("../../../common/middleware/authorization.js");
const user_validation_js_1 = require("../user.validation.js");
const validation_js_1 = require("../../../common/middleware/validation.js");
class UserFields {
    constructor() { }
    query = () => {
        return {
            getUsers: {
                type: user_type_js_1.userType,
                args: user_args_js_1.getUserArgs,
                resolve: (parent, args, context) => {
                    return user_service_js_1.default.getUsers();
                },
            },
            listUsers: {
                type: new graphql_1.GraphQLList(user_type_js_1.userType),
                resolve: async (parent, args, context) => {
                    const { user, decoded } = await (0, authentication_js_1.authentication_gql)(context.req.headers.authorization);
                    return await user_service_js_1.default.getUsers();
                },
            },
            getUser: {
                type: user_type_js_1.userType,
                args: { token: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) } },
                resolve: async (parent, args, context) => {
                    await (0, validation_js_1.Validation_GQL)(user_validation_js_1.getUserSchema, args);
                    const { user } = await (0, authentication_js_1.authentication_gql)(args.token);
                    await (0, authorization_js_1.authorization_gql)(["user"], user?.role);
                    return user_service_js_1.default.getUserById(user._id);
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
exports.UserFields = UserFields;
exports.default = new UserFields();
