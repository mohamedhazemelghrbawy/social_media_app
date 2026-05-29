"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = void 0;
const graphql_1 = require("graphql");
exports.userType = new graphql_1.GraphQLObjectType({
    name: "getUser",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        name: { type: graphql_1.GraphQLString },
        age: { type: graphql_1.GraphQLInt },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        profilePic: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
    },
});
