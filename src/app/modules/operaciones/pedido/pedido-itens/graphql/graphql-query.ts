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
    presentacionCreacion {
      id
      cantidad
    }
    cantidadCreacion
    precioUnitarioCreacion
    descuentoUnitarioCreacion
    valorTotal
    bonificacion
    bonificacionDetalle
    observacion
    vencimientoCreacion
    estado
    creadoEn
    usuarioCreacion {
      id
    }

    notaRecepcion {
      id
    }
    pedidoItemSucursalList {
      id
      sucursal {
        id
      }
      cantidadPorUnidad
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
      presentacionCreacion {
        id
        cantidad
      }
      cantidadCreacion
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      valorTotal
      bonificacion
      bonificacionDetalle
      observacion
      vencimientoCreacion
      estado
      creadoEn
      usuarioCreacion {
        id
      }

      notaRecepcion {
        id
      }
      pedidoItemSucursalList {
        id
        sucursal {
          id
        }
        cantidadPorUnidad
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
      presentacionCreacion {
        id
        cantidad
      }
      cantidadCreacion
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      valorTotal
      bonificacion
      bonificacionDetalle
      vencimientoCreacion
      estado
      creadoEn
      usuarioCreacion {
        id
      }

      notaRecepcion {
        id
      }
      pedidoItemSucursalList {
        id
        sucursal {
          id
          nombre
        }
        sucursalEntrega {
          id
          nombre
        }
        cantidadPorUnidad
      }
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
      presentacionCreacion {
        id
        cantidad
      }
      cantidadCreacion
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      valorTotal
      bonificacion
      bonificacionDetalle
      vencimientoCreacion
      estado
      creadoEn
      usuarioCreacion {
        id
      }

      notaRecepcion {
        id
      }
      pedidoItemSucursalList {
        id
        sucursal {
          id
          nombre
        }
        sucursalEntrega {
          id
          nombre
        }
        cantidadPorUnidad
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
      cantidadCreacion
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      valorTotal
      bonificacion
      bonificacionDetalle
      observacion
      vencimientoCreacion
      estado
      creadoEn
      usuarioCreacion {
        id
      }
      compraItem {
        id
      }
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
      isDistribucionSucursalesCreacion
      isDistribucionSucursalesRecepcion
      needsDistribucion
    }
  }
`;

export const deletePedidoItemQuery = gql`
  mutation deletePedidoItem($id: ID!) {
    deletePedidoItem(id: $id)
  }
`;
