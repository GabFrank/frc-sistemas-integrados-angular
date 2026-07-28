import gql from 'graphql-tag';

/**
 * Lotes registrados de un producto, ordenados por FEFO (fecha de retiro más próxima primero).
 * Incluye los bloqueados y en cuarentena, para poder administrarlos.
 */
export const lotesPorProductoQuery = gql`
  query lotesPorProducto($productoId: ID!) {
    data: lotesPorProducto(productoId: $productoId) {
      id
      numeroLote
      fechaVencimiento
      fechaRetiro
      fechaFabricacion
      estado
      observacion
      creadoEn
      proveedor {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

/** Saldo por lote de un producto en una sucursal, ordenado por FEFO. */
export const stockPorLoteQuery = gql`
  query stockPorLote($productoId: ID!, $sucursalId: ID!) {
    data: stockPorLote(productoId: $productoId, sucursalId: $sucursalId) {
      loteId
      productoId
      sucursalId
      numeroLote
      fechaVencimiento
      fechaRetiro
      estado
      cantidadDisponible
    }
  }
`;

/**
 * Mecanismo de recall: pasar un lote a BLOQUEADO lo saca de FEFO y del mostrador en todas las
 * sucursales, sin tocar el stock físico.
 */
export const cambiarEstadoLoteMutation = gql`
  mutation cambiarEstadoLote(
    $loteId: ID!
    $estado: EstadoLote!
    $observacion: String
    $usuarioId: ID
  ) {
    data: cambiarEstadoLote(
      loteId: $loteId
      estado: $estado
      observacion: $observacion
      usuarioId: $usuarioId
    ) {
      id
      numeroLote
      estado
      observacion
      actualizadoEn
    }
  }
`;
