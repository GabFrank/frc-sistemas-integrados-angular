import gql from "graphql-tag";

export const sincEstadoSubQuery = gql`
  subscription sincEstado {
    sincEstado {
      finalizado
      mensaje
    }
  }
`;

export const solicitarResourcesQuery = gql
  `{
    solicitarResources
  }`
