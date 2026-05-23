import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

export const getUserArgs = {
  name: { type: new GraphQLNonNull(GraphQLString) },
};

export const createUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLInt) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  age: { type: new GraphQLNonNull(GraphQLInt) },
};
