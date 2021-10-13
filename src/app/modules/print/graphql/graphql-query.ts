import gql from "graphql-tag";

export const printImage = gql`
  query ($image: String) {
    print(image: $image)
  }
`;
