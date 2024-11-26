import gql from "graphql-tag";

export const pedidoItensQuery = gql`
  {
    id
    pedido {
      id
    }
    producto {
      id
    }
    precioUnitario
    descuentoUnitario
    bonificacion
    bonificacionDetalle
    observacion
    estado
    vencimiento
    creadoEn
    usuario {
      id
    }
    pedidoItemSucursales {
      id
      sucursal {
        id
      }
      cantidad
      sucursalEntrega {
        id
      }
    }
  }
`;

export const pedidoItensSearch = gql`
  query ($texto: String) {
    data: pedidoSearch(texto: $texto) {
      id
      pedido {
        id
      }
      producto {
        id
      }
      precioUnitario
      descuentoUnitario
      bonificacion
      bonificacionDetalle
      observacion
      estado
      vencimiento
      creadoEn
      usuario {
        id
      }
      pedidoItemSucursales {
        id
        sucursal {
          id
        }
        cantidad
        sucursalEntrega {
          id
        }
      }
    }
  }
`;

export const pedidoItemQuery = gql`
  query ($id: ID!) {
    data: pedidoItem(id: $id) {
      id
      producto {
        id
        descripcion
      }
      presentacion {
        id
        cantidad
      }
      precioUnitario
      descuentoUnitario
      bonificacion
      bonificacionDetalle
      estado
      vencimiento
      creadoEn
      cantidad
      valorTotal
    }
  }
`;

export const pedidoItemPorPedidoIdQuery = gql`
  query ($id: Int!) {
    data: pedidoItensPorPedido(id: $id) {
      id
      producto {
        id
        descripcion
      }
      precioUnitario
      descuentoUnitario
      bonificacion
      bonificacionDetalle
      estado
      vencimiento
      creadoEn
      pedidoItemSucursales {
        id
        sucursal {
          id
          nombre
        }
        sucursalEntrega {
          id
          nombre
        }
        cantidad
      }
    }
  }
`;

export const savePedidoItem = gql`
  mutation savePedidoItem($entity: PedidoItemInput!) {
    data: savePedidoItem(pedidoItem: $entity) {
      id
      producto {
        id
        descripcion
        presentaciones {
          id
          cantidad
        }
        codigoPrincipal
      }
      presentacionCreacion {
        id
        cantidad
      }
      pedido {
        id
      }
      notaRecepcion {
        id
      }
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      bonificacion
      bonificacionDetalle
      estado
      vencimientoCreacion
      creadoEn
      cantidadCreacion
      valorTotal
      precioUnitarioRecepcionNota
      descuentoUnitarioRecepcionNota
      vencimientoRecepcionNota
      presentacionRecepcionNota {
        id
        cantidad
      }
      cantidadRecepcionNota
      precioUnitarioRecepcionProducto
      descuentoUnitarioRecepcionProducto
      vencimientoRecepcionProducto
      presentacionRecepcionProducto {
        id
        cantidad
      }
      cantidadRecepcionProducto
      usuarioRecepcionNota {
        id
      }
      usuarioRecepcionProducto {
        id
      }
      obsCreacion
      obsRecepcionNota
      obsRecepcionProducto
      autorizacionRecepcionNota
      autorizacionRecepcionProducto
      autorizadoPorRecepcionNota {
        id
      }
      autorizadoPorRecepcionProducto {
        id
      }
      motivoModificacionRecepcionNota
      motivoModificacionRecepcionProducto
      motivoRechazoRecepcionNota
      motivoRechazoRecepcionProducto
      cancelado
      verificadoRecepcionNota
      verificadoRecepcionProducto
      precioUnitario
      cantidad
      presentacion {
        id
        cantidad
      }
    }
  }
`;

export const deletePedidoItemQuery = gql`
  mutation deletePedidoItem($id: ID!) {
    deletePedidoItem(id: $id)
  }
`;
