import gql from "graphql-tag";

export const motivoObservacionQuery = gql`
  query ($id: ID!) {
    data: motivoObservacion(id: $id) {
      id
      descripcion
      activo
      creadoEn
      subcategoriaObservacion {
        id
        descripcion
      }
      usuario {
        id
      }
    }
  }
`;

export const motivosObservacionesQuery = gql`
  {
    data: motivosObservaciones {
      id
      descripcion
      activo
      subcategoriaObservacion {
        id
        descripcion
      }
    }
  }
`;

export const findByMotivoIdOrDescQuery = gql`
  query ($id: ID, $texto: String) {
    data: findByMotivoIdOrDesc(id: $id, texto: $texto) {
      id
      descripcion
      subcategoriaObservacion {
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


export const saveMotivoObservacionQuery = gql`
  mutation saveMotivoObservacion($entity: MotivoObservacionInput!) {
    data: saveMotivoObservacion(motivoObservacion: $entity) {
      id
      descripcion
      activo
      creadoEn
      subcategoriaObservacion {
        id
      }
      usuario {
        id
      }
    }
  }
`;

export const deleteMotivoObservacionQuery = gql`
  mutation deleteMotivoObservacion($id: ID!) {
    deleteMotivoObservacion(id: $id)
  }
`;