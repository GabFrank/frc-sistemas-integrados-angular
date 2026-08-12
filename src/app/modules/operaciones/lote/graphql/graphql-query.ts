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
    $vencimientoDesde: String
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
      vencimientoDesde: $vencimientoDesde
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
    $tipoMovimiento: TipoMovimiento
    $page: Int
    $size: Int
  ) {
    data: movimientosPorLote(
      loteId: $loteId
      sucursalId: $sucursalId
      tipoMovimiento: $tipoMovimiento
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
        documentoId
        cantidad
        usuarioNombre
      }
    }
  }
`;

/**
 * A qué clientes se les vendió el lote, una fila por venta. Es lo que hace accionable el recall:
 * bloquear el lote lo saca del mostrador, pero avisar exige saber a quién llamar.
 *
 * rastreable parte el resultado en dos conjuntos que no se solapan: en true las ventas con cliente
 * identificado, en false las de mostrador.
 */
export const clientesPorLoteQuery = gql`
  query clientesPorLote(
    $loteId: ID!
    $sucursalId: ID
    $rastreable: Boolean
    $page: Int
    $size: Int
  ) {
    data: clientesPorLote(
      loteId: $loteId
      sucursalId: $sucursalId
      rastreable: $rastreable
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
        ventaId
        sucursalId
        sucursalNombre
        fecha
        clienteId
        clienteNombre
        clienteDocumento
        clienteDireccion
        cantidad
      }
    }
  }
`;


/**
 * Las tres cuentas del producto en una sucursal. Es lo que la pantalla de ajuste muestra para que
 * el operador vea el efecto de lo que está por confirmar antes de confirmarlo.
 */
export const resumenStockLoteQuery = gql`
  query resumenStockLote($productoId: ID!, $sucursalId: ID!) {
    data: resumenStockLote(productoId: $productoId, sucursalId: $sucursalId) {
      productoId
      sucursalId
      existencia
      enLotes
      sinTrazar
    }
  }
`;

/**
 * Ajusta el stock de un lote en una sucursal. El backend escribe el movimiento agregado y su
 * desglose por lote en la misma transacción.
 *
 * Devuelve los saldos ya recalculados: entre que se abrió el diálogo y se confirmó pudo entrar una
 * venta del mismo lote, así que la pantalla muestra lo que quedó y no lo que ella predijo.
 */
export const ajustarStockLoteMutation = gql`
  mutation ajustarStockLote($input: AjusteStockLoteInput!) {
    data: ajustarStockLote(input: $input) {
      movimientoStockId
      sucursalId
      loteId
      numeroLote
      cantidadMovimiento
      saldoLote
      resumen {
        existencia
        enLotes
        sinTrazar
      }
    }
  }
`;

/**
 * Buscador paginado de lotes de un producto, con el saldo de cada uno en la sucursal.
 *
 * A diferencia de buscarStockPorLote, parte del maestro: incluye los lotes con saldo cero en esa
 * sucursal, que son justamente los que hacen falta para trazar mercadería que ya estaba en góndola
 * sin lote asignado.
 */
export const buscarLotesDeProductoQuery = gql`
  query buscarLotesDeProducto(
    $productoId: ID!
    $sucursalId: ID
    $texto: String
    $page: Int
    $size: Int
  ) {
    data: buscarLotesDeProducto(
      productoId: $productoId
      sucursalId: $sucursalId
      texto: $texto
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
        saldo
        saldoTotal
      }
    }
  }
`;
