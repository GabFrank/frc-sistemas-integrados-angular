import gql from "graphql-tag";

export const subCategoriasObservacionesQuery = gql`
  {
    data: subcategoriasObservaciones {
      id
      descripcion
      categoriaObservacion {
        id
        descripcion
      }
      activo
    }
  }
`;

export const subCategoriaObservacionQuery = gql`
  query ($id: ID!) {
    data: subcategoriaObservacion(id: $id) {
      id
      descripcion
      categoriaObservacion {
        id
      }
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const subCategoriaObservacionSearch = gql`
  query ($id: ID, $texto: String) {
    data: subcategoriaObservacionSearch(id: $id, texto: $texto) {
      id
      descripcion
      categoriaObservacion {
        id
      }
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const saveSubCategoriaObservacion = gql`
  mutation saveSubcategoriaObservacion($entity: SubcategoriaObservacionInput!) {
    data: saveSubcategoriaObservacion(subcategoriaObservacion: $entity) {
      id
      descripcion
      categoriaObservacion {
        id
      }
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const deleteSubCategoriaObservacion = gql`
  mutation deleteSubcategoriaObservacion($id: ID!) {
    deleteSubcategoriaObservacion(id: $id)
  }
`;