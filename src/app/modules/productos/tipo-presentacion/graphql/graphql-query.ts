import gql from 'graphql-tag';

export const tiposPresentacionQuery = gql`
  query {
    data: tiposPresentacion {
      id
      descripcion
    }
  }
`;

export const tipoPresentacion = gql`
  query ($id: Int) {
    data: tipoPresentacion(id: $id) {
      id
      descripcion
    }
  }
`;

export const saveTipoPresentacion = gql`
  mutation saveTipoPresentacion($entity: TipoPresentacionInput!) {
    data: saveTipoPresentacion(tipoPresentacion: $entity) {
      id
      descripcion
    }
  }
`;

export const deleteTipoPresentacionQuery = gql`
  mutation deleteTipoPresentacion($id: ID!) {
    deleteTipoPresentacion(id: $id)
  }
`;
