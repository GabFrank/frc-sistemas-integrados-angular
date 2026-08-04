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
 * Mismo saldo que stockPorLote pero expresado en la presentación con la que carga el operador.
 * La conversión la hace el backend: acá solo se muestra lo que devuelve.
 */
export const stockPorLoteEnPresentacionQuery = gql`
  query stockPorLoteEnPresentacion(
    $productoId: ID!
    $sucursalId: ID!
    $presentacionId: ID
    $numeroLote: String
    $page: Int
    $size: Int
  ) {
    data: stockPorLoteEnPresentacion(
      productoId: $productoId
      sucursalId: $sucursalId
      presentacionId: $presentacionId
      numeroLote: $numeroLote
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
        loteId
        numeroLote
        fechaVencimiento
        fechaRetiro
        estado
        cantidadDisponible
        cantidadDisponiblePresentacion
        unidadesSobrantes
        unidadesPorPresentacion
        presentacionDescripcion
      }
    }
  }
`;

/**
 * Consulta general "¿dónde tengo qué?". Todos los filtros son opcionales.
 * El orden es FEFO: lo que hay que sacar primero aparece primero.
 */
export const buscarStockPorLoteQuery = gql`
  query buscarStockPorLote(
    $productoId: ID
    $sucursalId: ID
    $proveedorId: ID
    $estado: EstadoLote
    $numeroLote: String
    $texto: String
    $vencimientoHasta: String
    $page: Int
    $size: Int
  ) {
    data: buscarStockPorLote(
      productoId: $productoId
      sucursalId: $sucursalId
      proveedorId: $proveedorId
      estado: $estado
      numeroLote: $numeroLote
      texto: $texto
      vencimientoHasta: $vencimientoHasta
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
        loteId
        productoId
        productoDescripcion
        numeroLote
        fechaVencimiento
        fechaRetiro
        estado
        proveedorNombre
        cantidadDisponible
      }
    }
  }
`;

/**
 * Desglose por sucursal del saldo de un lote. Trae todas las sucursales, con 0 en las que no
 * tienen ese lote.
 */
export const stockLotePorSucursalQuery = gql`
  query ($loteId: ID!) {
    data: stockLotePorSucursal(loteId: $loteId) {
      sucursalId
      sucursalNombre
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

/**
 * Historial de un lote, del movimiento más reciente al más viejo. Con sucursalId nulo devuelve el
 * recorrido completo por toda la red: la compra que lo trajo, las transferencias que lo
 * repartieron y las ventas que lo sacaron.
 */
export const movimientosPorLoteQuery = gql`
  query movimientosPorLote(
    $loteId: ID!
    $sucursalId: ID
    $page: Int
    $size: Int
  ) {
    data: movimientosPorLote(
      loteId: $loteId
      sucursalId: $sucursalId
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
        sucursalId
        fecha
        sucursalNombre
        tipoMovimiento
        referencia
        cantidad
        usuarioNombre
      }
    }
  }
`;
