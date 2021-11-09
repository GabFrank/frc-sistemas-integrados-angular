import gql from "graphql-tag";

export const entradaItemsQuery = gql`
  {
    data: entradaItems {
      id
      entrada {
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

export const entradaItemQuery = gql`
  query ($id: ID!) {
    data: entradaItem(id: $id) {
      id
      entrada {
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

export const saveEntradaItem = gql`
  mutation saveEntradaItem($entity: EntradaItemInput!) {
    data: saveEntradaItem(entradaItem: $entity) {
      id
      entrada {
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

export const deleteEntradaItemQuery = gql`
  mutation deleteEntradaItem($id: ID!) {
    deleteEntradaItem(id: $id)
  }
`;
