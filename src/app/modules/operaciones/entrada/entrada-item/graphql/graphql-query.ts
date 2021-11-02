import gql from "graphql-tag";

export const entradaItemsQuery = gql`
  {
    data: entradaItemItems {
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
      tipoEntradaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const entradaItemQuery = gql`
  query ($id: ID!) {
    data: entradaItem(id: $id) {
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
      tipoEntradaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const saveEntradaItem = gql`
  mutation saveEntradaItem($entity: EntradaItemInput!) {
    data: saveEntradaItem(entradaItem: $entity) {
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
      tipoEntradaItem
      observacion
      creadoEn
      usuario {
        id
        nombre
      }
    }
  }
`;

export const deleteEntradaItemQuery = gql`
  mutation deleteEntradaItem($id: ID!) {
    deleteEntradaItem(id: $id)
  }
`;
