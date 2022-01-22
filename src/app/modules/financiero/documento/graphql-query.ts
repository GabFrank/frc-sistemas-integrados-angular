import gql from "graphql-tag";

export const documentosQuery = gql`
  {
    data: documentos {
      id
      descripcion
      activo
    }
  }
`;
