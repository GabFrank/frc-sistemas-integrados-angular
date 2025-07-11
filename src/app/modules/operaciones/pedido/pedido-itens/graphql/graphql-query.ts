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
    cantidadSolicitada
    precioUnitarioSolicitado
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
      cantidadSolicitada
      precioUnitarioSolicitado
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
      cantidadSolicitada
      precioUnitarioSolicitado
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
      cantidadSolicitada
      precioUnitarioSolicitado
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
      cantidadSolicitada
      precioUnitarioSolicitado
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
      
      # Legacy computed fields for compatibility
      precioUnitario
      cantidad
      presentacion {
        id
        cantidad
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

export const deletePedidoItemQuery = gql`
  mutation deletePedidoItem($id: ID!) {
    deletePedidoItem(id: $id)
  }
`;
