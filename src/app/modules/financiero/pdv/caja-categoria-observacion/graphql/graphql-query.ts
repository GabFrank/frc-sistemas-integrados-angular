import gql from "graphql-tag";

export const cajasCategoriasObservacionesQuery = gql`
  {
    data: cajasCategoriasObservaciones {
      id
      descripcion
      activo
    }
  }
`;

export const cajaCategoriaObservacionQuery = gql`
  query ($id: ID!) {
    data: cajaCategoriaObservacion(id: $id) {
      id
      descripcion
      activo
      creadoEn
    }
  }
`;

export const findByIdOrDescQuery = gql`
  query ($id: ID, $texto: String) {
    data: findByIdOrDesc(id: $id, texto: $texto) {
      id
      descripcion
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const saveCajaCategoriaObservacion = gql`
  mutation saveCategoriaObservacion($entity: CajaCategoriaObservacionInput!) {
    data: saveCajaCategoriaObservacion(cajaCategoriaObservacion: $entity) {
      id
      descripcion
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const deleteCajaCategoriaObservacionQuery = gql`
  mutation deleteCajaCategoriaObservacion($id: ID!) {
    deleteCajaCategoriaObservacion(id: $id)
  }
`;