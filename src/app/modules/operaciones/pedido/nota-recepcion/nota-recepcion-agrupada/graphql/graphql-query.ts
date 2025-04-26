import gql from 'graphql-tag';

// Query: Fetch NotaRecepcionAgrupada by notaRecepcionId
export const notaRecepcionAgrupadaPorProveedorIdQuery = gql`
  query ($id: ID!, $page: Int!, $size: Int!) {
    data: notaRecepcionListPorProveedorId(id: $id, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
        cantNotas
        sucursal {
          id
          nombre
        }
        creadoEn
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

// Query: Fetch paginated list of NotaRecepcionAgrupada by usuarioId
export const notaRecepcionListPorUsuarioIdQuery = gql`
  query ($id: ID!, $page: Int!, $size: Int!) {
    data: notaRecepcionListPorUsuarioId(id: $id, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        proveedor {
          id
          persona {
            nombre
          }
        }
        cantNotas
        sucursal {
          id
          nombre
        }
        creadoEn
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const notaRecepcionAgrupadaPorIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionAgrupadaPorId(id: $id) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      cantNotas
      sucursal {
        id
        nombre
      }
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

// Mutation: Save NotaRecepcionAgrupada
export const saveNotaRecepcionAgrupadaMutation = gql`
  mutation saveNotaRecepcionAgrupada($entity: NotaRecepcionAgrupadaInput!) {
    data: saveNotaRecepcionAgrupada(entity: $entity) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      cantNotas
      sucursal {
        id
        nombre
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

// Query: Fetch paginated PedidoRecepcionProducto by NotaRecepcionAgrupada ID
export const pedidoRecepcionProductoPorNotaRecepcionAgrupadaQuery = gql`
  query ($id: ID!, $estado: PedidoRecepcionProductoEstado, $page: Int, $size: Int) {
    data: pedidoRecepcionProductoPorNotaRecepcionAgrupada(id: $id, estado: $estado, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        producto {
          id
          descripcion
          presentaciones {
            id
            cantidad
          }
        }
        totalCantidadARecibirPorUnidad
        totalCantidadRecibidaPorUnidad
        estado
      }
    }
  }
`;

// Query: Fetch a single PedidoRecepcionProductoDto by NotaRecepcionAgrupada ID and Producto ID
export const pedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoQuery = gql`
  query ($notaRecepcionAgrupadaId: ID!, $productoId: ID!, $estado: PedidoRecepcionProductoEstado) {
    data: pedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto(
      notaRecepcionAgrupadaId: $notaRecepcionAgrupadaId, 
      productoId: $productoId,
      estado: $estado
    ) {
      producto {
        id
        descripcion
        presentaciones {
            id
            cantidad
          }
      }
      totalCantidadARecibirPorUnidad
      totalCantidadRecibidaPorUnidad
      estado
    }
  }
`;

// Add this mutation at the end of the file
export const recepcionProductoNotaRecepcionAgrupadaMutation = gql`
  mutation recepcionProductoNotaRecepcionAgrupada(
    $notaRecepcionAgrupadaId: ID!, 
    $productoId: ID!, 
    $sucursalId: ID!, 
    $cantidad: Float!
  ) {
    data: recepcionProductoNotaRecepcionAgrupada(
      notaRecepcionAgrupadaId: $notaRecepcionAgrupadaId,
      productoId: $productoId,
      sucursalId: $sucursalId,
      cantidad: $cantidad
    )
  }
`;

export const finalizarRecepcionMutation = gql`
  mutation finalizarRecepcion($id: ID!) {
    data: finalizarRecepcion(id: $id) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const reabrirRecepcionMutation = gql`
  mutation reabrirRecepcion($id: ID!) {
    data: reabrirRecepcion(id: $id) {
      id
      estado
      proveedor {
        id
        persona {
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

// New mutation for requesting payment for a grouped receipt note
export const solicitarPagoNotaRecepcionAgrupadaMutation = gql`
  mutation solicitarPagoNotaRecepcionAgrupada($id: ID!) {
    data: solicitarPagoNotaRecepcionAgrupada(id: $id) {
      id
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
      estado
      tipo
      referenciaId
    }
  }
`;
