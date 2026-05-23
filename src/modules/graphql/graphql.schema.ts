import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import UserFields from "../auth/graphql/user.fields.js";

export const gql_schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    description: "query",
    fields: {
      ...UserFields.query(),
    },
  }),
  mutation: new GraphQLObjectType({
    name: "mutation",
    fields: {
      ...UserFields.mutation(),
    },
  }),
});
