"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = exports.getUserArgs = void 0;
const graphql_1 = require("graphql");
exports.getUserArgs = {
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
};
exports.createUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
};
