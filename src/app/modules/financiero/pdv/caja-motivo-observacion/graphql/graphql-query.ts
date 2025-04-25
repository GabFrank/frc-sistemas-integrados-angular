import gql from "graphql-tag";

export const cajaMotivoObservacionQuery = gql`
  query ($id: ID!) {
    data: cajaMotivoObservacion(id: $id) {
      id
      descripcion
      activo
      creadoEn
      cajaSubCategoriaObservacion {
        id
        descripcion
      }
      usuario {
        id
      }
    }
  }
`;

export const cajaMotivosObservacionesQuery = gql`
  {
    data: cajaMotivoObservaciones {
      id
      descripcion
      activo
      cajaSubCategoriaObservacion {
        id
        descripcion
      }
    }
  }
`;

export const findByCajaMotivoIdOrDescQuery = gql`
  query ($id: ID, $texto: String) {
    data: findByCajaMotivoIdOrDesc(id: $id, texto: $texto) {
      id
      descripcion
      cajaSubCategoriaObservacion {
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


export const saveCajaMotivoObservacionQuery = gql`
  mutation saveCajaMotivoObservacion($entity: CajaMotivoObservacionInput!) {
    data: saveCajaMotivoObservacion(cajaMotivoObservacion: $entity) {
      id
      descripcion
      activo
      creadoEn
      cajaSubCategoriaObservacion {
        id
      }
      usuario {
        id
      }
    }
  }
`;

export const deleteCajaMotivoObservacionQuery = gql`
  mutation deleteCajaMotivoObservacion($id: ID!) {
    deleteCajaMotivoObservacion(id: $id)
  }
`;