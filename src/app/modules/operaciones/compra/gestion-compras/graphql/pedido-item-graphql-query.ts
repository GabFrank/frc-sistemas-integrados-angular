import gql from "graphql-tag";

// ===== QUERIES =====

export const pedidoItemQuery = gql`
  query ($id: ID!) {
    data: pedidoItem(id: $id) {
      id
      cantidadSolicitada
      precioUnitarioSolicitado
      vencimientoEsperado
      observacion
      esBonificacion
      estado
      creadoEn
      producto {
        id
        descripcion
        codigoPrincipal
        vencimiento
        presentaciones {
          id
          descripcion
          cantidad
        }
      }
      presentacionCreacion {
        id
        descripcion
        cantidad
      }
      pedido {
        id
        estado
      }
      usuarioCreacion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const pedidoItemsByPedidoQuery = gql`
  query ($id: ID!) {
    data: pedidoItemPorPedido(id: $id) {
      id
      cantidadSolicitada
      precioUnitarioSolicitado
      vencimientoEsperado
      observacion
      esBonificacion
      estado
      creadoEn
      producto {
        id
        descripcion
        codigoPrincipal
        vencimiento
        presentaciones {
          id
          descripcion
          cantidad
        }
      }
      presentacionCreacion {
        id
        descripcion
        cantidad
      }
      pedido {
        id
        estado
      }
      usuarioCreacion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const pedidoItemsByPedidoPageQuery = gql`
  query ($pedidoId: ID!, $page: Int = 0, $size: Int = 10, $texto: String) {
    data: pedidoItemPorPedidoPage(
      id: $pedidoId
      page: $page
      size: $size
      texto: $texto
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        vencimientoEsperado
        observacion
        esBonificacion
        estado
        creadoEn
        producto {
          id
          descripcion
          codigoPrincipal
          vencimiento
          presentaciones {
            id
            descripcion
            cantidad
          }
        }
        presentacionCreacion {
          id
          descripcion
          cantidad
        }
        pedido {
          id
          estado
        }
        usuarioCreacion {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

// ===== MUTATIONS =====

export const savePedidoItemMutation = gql`
  mutation savePedidoItem($input: PedidoItemInput!) {
    data: savePedidoItem(pedidoItem: $input) {
      id
      cantidadSolicitada
      precioUnitarioSolicitado
      vencimientoEsperado
      observacion
      esBonificacion
      estado
      creadoEn
      producto {
        id
        descripcion
        codigoPrincipal
        vencimiento
        presentaciones {
          id
          descripcion
          cantidad
        }
      }
      presentacionCreacion {
        id
        descripcion
        cantidad
      }
      pedido {
        id
        estado
      }
      usuarioCreacion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deletePedidoItemMutation = gql`
  mutation deletePedidoItem($id: ID!) {
    data: deletePedidoItem(id: $id)
  }
`;
