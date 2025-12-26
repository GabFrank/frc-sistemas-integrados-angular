import gql from "graphql-tag";

// Fragmento para DevolucionItem
export const DevolucionItemFragment = gql`
  fragment DevolucionItemFragment on DevolucionItem {
    id
    producto {
      id
      descripcion
    }
    cantidad
    lote
    recepcionMercaderiaItem {
        id # Para trazabilidad
    }
  }
`;

// Fragmento para la cabecera de Devolucion
export const DevolucionFragment = gql`
  fragment DevolucionFragment on Devolucion {
    id
    proveedor {
      id
      persona {
        nombre
      }
    }
    sucursalOrigen {
      id
      nombre
    }
    fecha
    motivo
    estado
    usuario {
      id
      persona {
        nombre
      }
    }
    devolucionItemList {
      ...DevolucionItemFragment
    }
  }
  ${DevolucionItemFragment}
`;

// Query para obtener una Devolucion por ID
export const getDevolucionById = gql`
  query getDevolucionById($id: ID!) {
    data: devolucion(id: $id) {
      ...DevolucionFragment
    }
  }
  ${DevolucionFragment}
`;

// Mutation para crear/actualizar una Devolucion
export const saveDevolucion = gql`
  mutation saveDevolucion($entity: DevolucionInput!) {
    data: saveDevolucion(entity: $entity) {
      ...DevolucionFragment
    }
  }
  ${DevolucionFragment}
`;

// Mutation para confirmar una Devolucion
export const confirmarDevolucion = gql`
    mutation confirmarDevolucion($id: ID!) {
        data: confirmarDevolucion(id: $id)
    }
`; 