import gql from "graphql-tag";

export const salidaItemsQuery = gql`
  {
    data: salidaItemItems {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalidaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const salidaItemQuery = gql`
  query ($id: ID!) {
    data: salidaItem(id: $id) {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalidaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const saveSalidaItem = gql`
  mutation saveSalidaItem($entity: SalidaItemInput!) {
    data: saveSalidaItem(salidaItem: $entity) {
      id
      responsableCarga {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      tipoSalidaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const deleteSalidaItemQuery = gql`
  mutation deleteSalidaItem($id: ID!) {
    deleteSalidaItem(id: $id)
  }
`;
