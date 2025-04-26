import gql from "graphql-tag";

export const cajaSubCategoriasObservacionesQuery = gql`
  {
    data: cajaSubCategoriasObservaciones {
      id
      descripcion
      cajaCategoriaObservacion {
        id
        descripcion
      }
      activo
    }
  }
`;
  
export const cajaSubCategoriaObservacionQuery = gql`
  query ($id: ID!) {
    data: cajaSubCategoriaObservacion(id: $id) {
      id
      descripcion
      cajaCategoriaObservacion {
        id
        descripcion
      }
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const findByCajaSubCategoriaIdOrDescQuery = gql`
  query ($id: ID, $texto: String) {
    data: findByCajaSubCategoriaIdOrDesc(id: $id, texto: $texto) {
      id
      descripcion
      cajaCategoriaObservacion {
        id
        descripcion
      }
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const saveCajaSubCategoriaObservacionQuery = gql`
  mutation saveCajaSubCategoriaObservacion($entity: CajaSubCategoriaObservacionInput!) {
    data: saveCajaSubCategoriaObservacion(cajaSubCategoriaObservacion: $entity) {
      id
      descripcion
      cajaCategoriaObservacion {
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

export const deleteCajaSubCategoriaObservacionQuery = gql`
  mutation deleteCajaSubCategoriaObservacion($id: ID!) {
    deleteCajaSubCategoriaObservacion(id: $id)
  }
`;