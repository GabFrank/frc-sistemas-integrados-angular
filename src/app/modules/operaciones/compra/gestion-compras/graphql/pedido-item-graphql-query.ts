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
      distribucionConcluida
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
      distribucionConcluida
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
  query ($pedidoId: ID!, $page: Int = 0, $size: Int = 10, $texto: String, $soloPendientes: Boolean) {
    data: pedidoItemPorPedidoPage(
      id: $pedidoId
      page: $page
      size: $size
      texto: $texto
      soloPendientes: $soloPendientes
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
        creadoEn
        distribucionConcluida
        cantidadPendiente
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
      distribucionConcluida
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

/** Mismos campos que savePedidoItem: el diálogo arma con ellos el ítem que devuelve al pedido. */
export const guardarPedidoItemConDistribucionesMutation = gql`
  mutation guardarPedidoItemConDistribuciones($pedidoItem: PedidoItemInput!, $distribuciones: [PedidoItemDistribucionInput]!) {
    data: guardarPedidoItemConDistribuciones(pedidoItem: $pedidoItem, distribuciones: $distribuciones) {
      id
      cantidadSolicitada
      precioUnitarioSolicitado
      vencimientoEsperado
      observacion
      esBonificacion
      estado
      creadoEn
      distribucionConcluida
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

/**
 * Variación del costo de cada ítem del pedido contra la última compra del producto. Un elemento por ítem
 * (todos, sin paginar): la regla (umbral, moneda, qué compras cuentan) la decide el central.
 */
export const variacionCostoPedidoItemsQuery = gql`
  query variacionCostoPedidoItems($pedidoId: ID!) {
    data: variacionCostoPedidoItems(pedidoId: $pedidoId) {
      pedidoItemId
      precioActual
      ultimoPrecio
      variacion
      direccion
      texto
    }
  }
`;

/** Cambia (o borra, con `null`) el vencimiento esperado de un ítem. Mismos campos que pedidoItemPorPedidoPage. */
export const actualizarVencimientoPedidoItemMutation = gql`
  mutation actualizarVencimientoPedidoItem($pedidoItemId: ID!, $vencimiento: String) {
    data: actualizarVencimientoPedidoItem(pedidoItemId: $pedidoItemId, vencimiento: $vencimiento) {
      id
      cantidadSolicitada
      precioUnitarioSolicitado
      vencimientoEsperado
      observacion
      esBonificacion
      creadoEn
      distribucionConcluida
      cantidadPendiente
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
