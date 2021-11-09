import gql from "graphql-tag";

export const salidaItemsQuery = gql`
  {
    data: salidaItems {
      id
      salida {
        id
      }
      producto {
        id
        descripcion
      }
      presentacion {
        id
        descripcion
        codigoPrincipal
        precioPrincipal
      }
      observacion
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const salidaItemQuery = gql`
  query ($id: ID!) {
    data: salidaItem(id: $id) {
      id
      salida {
        id
      }
      producto {
        id
        descripcion
      }
      presentacion {
        id
        descripcion
        codigoPrincipal
        precioPrincipal
      }
      observacion
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveSalidaItem = gql`
  mutation saveSalidaItem($entity: SalidaItemInput!) {
    data: saveSalidaItem(salidaItem: $entity) {
      id
      salida {
        id
      }
      producto {
        id
        descripcion
      }
      presentacion {
        id
        descripcion
        codigoPrincipal{
          id
          codigo
        }
        precioPrincipal{
          id
          precio
        }
      }
      observacion
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteSalidaItemQuery = gql`
  mutation deleteSalidaItem($id: ID!) {
    deleteSalidaItem(id: $id)
  }
`;
