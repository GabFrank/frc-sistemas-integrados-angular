import gql from "graphql-tag";

export const printImage = gql`
  query ($image: String) {
    print(image: $image)
  }
`;

export const printVale = gql`
  query ($entity: ValeInput) {
    printVale(entity: $entity)
  }
`;
