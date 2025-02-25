import gql from "graphql-tag";

export const categoriasObservacionesQuery = gql`
  {
    data: categoriasObservaciones {
      id
      descripcion
      activo
    }
  }
`;

export const categoriaObservacionQuery = gql`
  query ($id: ID!) {
    data: categoriaObservacion(id: $id) {
      id
      descripcion
      activo
      creadoEn
    }
  }
`;

export const categoriaObservacionSearch = gql`
  query ($id: ID, $texto: String) {
    data: categoriaObservacionSearch(id: $id, texto: $texto) {
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

export const saveCategoriaObservacion = gql`
  mutation saveCategoriaObservacion($entity: CategoriaObservacionInput!) {
    data: saveCategoriaObservacion(categoriaObservacion: $entity) {
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

export const deleteCategoriaObservacionQuery = gql`
  mutation deleteCategoriaObservacion($id: ID!) {
    deleteCategoriaObservacion(id: $id)
  }
`;