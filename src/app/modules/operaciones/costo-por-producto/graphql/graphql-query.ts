import gql from "graphql-tag";

export const costosPorProductoIdQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: costosPorProductoId(id: $id, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        sucursal {
          id
        }
        producto {
          id
          descripcion
        }
        movimientoStock {
          id
          referencia
          tipoMovimiento
        }
        ultimoPrecioCompra
        ultimoPrecioVenta
        costoMedio
        moneda {
          id
        }
        cotizacion
        existencia
        creadoEn
        usuario {
          id
        }
      }
    }
  }
`;

export const costoQuery = gql`
  query ($id: ID!) {
    data: costo(id: $id) {
      id
      sucursal {
        id
      }
      producto {
        id
        descripcion
      }
      movimientoStock {
        id
        referencia
        tipoMovimiento
      }
      ultimoPrecioCompra
      ultimoPrecioVenta
      costoMedio
      moneda {
        id
      }
      cotizacion
      existencia
      creadoEn
      usuario
    }
  }
`;

export const saveCostoPorProductoMutation = gql`
  mutation saveCostoPorProducto($costoPorProducto: CostoPorProductoInput!) {
    data: saveCostoPorProducto(costoPorProducto: $costoPorProducto) {
      id
      sucursal {
        id
        nombre
      }
      producto {
        id
        descripcion
      }
      movimientoStock {
        id
        referencia
        tipoMovimiento
      }
      ultimoPrecioCompra
      ultimoPrecioVenta
      costoMedio
      moneda {
        id
      }
      cotizacion
      existencia
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
