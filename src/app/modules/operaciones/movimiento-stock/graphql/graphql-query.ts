import gql from "graphql-tag";

export const movimientosQuery = gql`
  {
    data: movimientos {
      id
      sucursalId
      producto {
        id
        descripcion
      }
      tipoMovimiento
      referencia
      creadoEn
      usuario {
        id
      }
      cantidad
      estado
      sucursal {
        id
      }
    }
  }
`;

export const movimientoQuery = gql`
  query ($id: ID!) {
    data: movimiento(id: $id) {
      id
      sucursalId
      producto {
        id
        descripcion
      }
      tipoMovimiento
      referencia
      creadoEn
      usuario {
        id
      }
      cantidad
      estado
      sucursal {
        id
      }
    }
  }
`;

export const movimientoPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: movimientoStockByFecha(inicio: $inicio, fin: $fin) {
      id
      sucursalId
      producto {
        id
        descripcion
      }
      tipoMovimiento
      referencia
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      cantidad
      estado
      sucursal {
        id
      }
    }
  }
`;

export const saveMovimiento = gql`
  mutation saveMovimiento($entity: MovimientoInput!) {
    data: saveMovimiento(movimiento: $entity) {
      id
      sucursalId
      producto {
        id
        descripcion
      }
      tipoMovimiento
      referencia
      creadoEn
      usuario {
        id
      }
      cantidad
      estado
      sucursal {
        id
      }
    }
  }
`;

export const deleteMovimientoQuery = gql`
  mutation deleteMovimiento($id: ID!) {
    deleteMovimiento(id: $id)
  }
`;

export const stockPorProductoQuery = gql`
  query ($id: ID!) {
    data: stockPorProducto(id: $id)
  }
`;

export const findMovimientoStockByFiltersQuery = gql`
  query (
    $inicio: String
    $fin: String
    $sucursalList: [Int]
    $productoId: Int
    $tipoMovimientoList: [TipoMovimiento]
    $usuarioId: Int
    $page: Int
    $size: Int
  ) {
    data: findMovimientoStockByFilters(
      inicio: $inicio
      fin: $fin
      sucursalList: $sucursalList
      productoId: $productoId
      tipoMovimientoList: $tipoMovimientoList
      usuarioId: $usuarioId
      page: $page
      size: $size
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
        producto {
          id
          descripcion
        }
        tipoMovimiento
        referencia
        creadoEn
        usuario {
          id
          nickname
        }
        cantidad
        estado
        proveedor {
          id
        }
        sucursalId
      }
    }
  }
`;
