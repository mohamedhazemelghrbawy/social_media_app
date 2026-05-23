import {
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export const userType = new GraphQLObjectType({
  name: "getUser",
  fields: {
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    profilePic: { type: GraphQLString },
    phone: { type: GraphQLString },
    email: { type: GraphQLString },
  },
});
