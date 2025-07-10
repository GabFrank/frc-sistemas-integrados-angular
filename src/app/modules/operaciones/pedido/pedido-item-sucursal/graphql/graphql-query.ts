import { gql } from 'apollo-angular';

export const pedidoItemSucursalQuery = gql`
  query pedidoItemSucursal($id: ID!) {
    data: pedidoItemSucursal(id: $id) {
      id
      pedidoItem {
        id
      }
      sucursal {
        id
        nombre
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadPorUnidad
      cantidadPorUnidadRecibida
      cantidadPorUnidadRechazada
      rechazado
      motivoRechazo
      modificado
      motivoModificacion
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
      fechaRecepcion
      verificado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      stockDisponible
    }
  }
`;

export const pedidoItensSucursalQuery = gql`
  query pedidoItensSucursal($page: Int, $size: Int) {
    data: pedidoItensSucursal(page: $page, size: $size) {
      id
      pedidoItem {
        id
      }
      sucursal {
        id
        nombre
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadPorUnidad
      cantidadPorUnidadRecibida
      cantidadPorUnidadRechazada
      rechazado
      motivoRechazo
      modificado
      motivoModificacion
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
      fechaRecepcion
      verificado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      stockDisponible
    }
  }
`;

export const countPedidoItemSucursalQuery = gql`
  query countPedidoItemSucursal {
    data: countPedidoItemSucursal
  }
`;

export const savePedidoItemSucursalMutation = gql`
  mutation savePedidoItemSucursal($entity: PedidoItemSucursalInput!) {
    data: savePedidoItemSucursal(entity: $entity) {
      id
      pedidoItem {
        id
      }
      sucursal {
        id
        nombre
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadPorUnidad
      cantidadPorUnidadRecibida
      cantidadPorUnidadRechazada
      rechazado
      motivoRechazo
      modificado
      motivoModificacion
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
      fechaRecepcion
      verificado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      stockDisponible
    }
  }
`;

export const deletePedidoItemSucursalMutation = gql`
  mutation deletePedidoItemSucursal($id: ID!) {
    data: deletePedidoItemSucursal(id: $id)
  }
`;

export const pedidoItensSucursalByPedidoItemQuery = gql`
  query pedidoItemSucursalPorPedidoItem($id: Int!) {
    data: pedidoItemSucursalPorPedidoItem(id: $id) {
      id
      pedidoItem {
        id
      }
      sucursal {
        id
        nombre
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadPorUnidad
      cantidadPorUnidadRecibida
      cantidadPorUnidadRechazada
      rechazado
      motivoRechazo
      modificado
      motivoModificacion
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
      fechaRecepcion
      verificado
      observacion
      stockDisponible
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