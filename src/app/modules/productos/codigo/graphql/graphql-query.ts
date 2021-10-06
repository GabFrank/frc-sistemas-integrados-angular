import gql from "graphql-tag";

export const codigosQuery = gql`
  {
    id
    activo
    principal
    codigo
  }
`;

// export const codigoPorProductoId = gql
// `
// `

export const codigoPorCodigo = gql`
  query ($texto: String) {
    data: codigoPorCodigo(texto: $texto) {
      id
      activo
      principal
      codigo
    }
  }
`;

export const codigosPorPresentacionId = gql`
  query ($id: Int) {
    data: codigosPorPresentacionId(id: $id) {
      id
      activo
      principal
      codigo
    }
  }
`;

export const codigoQuery = gql`
  query ($id: ID!) {
    data: codigo(id: $id) {
      id
      activo
      principal
      codigo
    }
  }
`;

export const saveCodigo = gql`
  mutation saveCodigo($entity: CodigoInput!) {
    data: saveCodigo(codigo: $entity) {
      id
      activo
      principal
      codigo
      presentacion {
        id
      }
    }
  }
`;

export const deleteCodigoQuery = gql`
  mutation deleteCodigo($id: ID!) {
    deleteCodigo(id: $id)
  }
`;
