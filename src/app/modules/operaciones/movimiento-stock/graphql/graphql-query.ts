import gql from "graphql-tag";

export const movimientosQuery = gql`
  {
    data: movimientos {
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
