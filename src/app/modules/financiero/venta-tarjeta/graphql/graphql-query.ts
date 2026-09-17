import gql from 'graphql-tag';

export const saveVentaTarjetaMutation = gql`
  mutation saveVentaTarjeta($entity: VentaTarjetaInput!) {
    data: saveVentaTarjeta(ventaTarjeta: $entity) {
      id
      sucursalId
      estado
      monto
      creadoEn
    }
  }
`;

export const countVentasTarjetaSinRegistrarQuery = gql`
  query countVentasTarjetaSinRegistrar($cajaId: ID!, $sucId: ID!) {
    data: countVentasTarjetaSinRegistrar(cajaId: $cajaId, sucId: $sucId)
  }
`;

export const cancelarVentaTarjetaPorVentaIdMutation = gql`
  mutation cancelarVentaTarjetaPorVentaId($ventaId: ID!, $sucId: ID!) {
    data: cancelarVentaTarjetaPorVentaId(ventaId: $ventaId, sucId: $sucId)
  }
`;

export const filtrarVentasTarjetaQuery = gql`
  query filtrarVentasTarjeta(
    $id: ID, $ventaId: ID, $sucursalId: ID, $terminalDescripcion: String, $terminalCodigo: String,
    $estado: String, $fechaDesde: String, $fechaHasta: String,
    $page: Int, $size: Int
  ) {
    data: filtrarVentasTarjeta(
      id: $id, ventaId: $ventaId, sucursalId: $sucursalId, terminalDescripcion: $terminalDescripcion, terminalCodigo: $terminalCodigo,
      estado: $estado, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta,
      page: $page, size: $size
    ) {
      getContent {
        id
        sucursalId
        caja { id }
        sucursal { id nombre }
        venta { id totalGs }
        terminalPos { id codigo descripcion cargaManualPermitida proveedorServicio { id } moneda { id simbolo decimales } formatoTerminalPos { id nombre tipo mapeo } }
        moneda { id simbolo decimales }
        monto
        montoEscaneado
        estado
        creadoEn
        usuario { id nickname }
      }
      getTotalElements
    }
  }
`;

export const imprimirReporteVentaTarjetaQuery = gql`
  query imprimirReporteVentaTarjeta(
    $id: ID, $ventaId: ID, $sucursalId: ID, $terminalDescripcion: String, $terminalCodigo: String,
    $estado: String, $fechaDesde: String, $fechaHasta: String,
    $usuarioResponsableId: ID
  ) {
    data: imprimirReporteVentaTarjeta(
      id: $id, ventaId: $ventaId, sucursalId: $sucursalId, terminalDescripcion: $terminalDescripcion, terminalCodigo: $terminalCodigo,
      estado: $estado, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta,
      usuarioResponsableId: $usuarioResponsableId
    )
  }
`;

export const configuracionVentaTarjetaQuery = gql`
  {
    data: configuracionVentaTarjeta {
      id
      habilitado
      usuario {
        id
        nickname
      }
      creadoEn
      modificadoEn
    }
  }
`;

export const saveConfiguracionVentaTarjeta = gql`
  mutation saveConfiguracionVentaTarjeta($entity: ConfiguracionVentaTarjetaInput!) {
    data: saveConfiguracionVentaTarjeta(input: $entity) {
      id
      habilitado
      usuario {
        id
        nickname
      }
      creadoEn
      modificadoEn
    }
  }
`;

export const ventaTarjetaPorIdQuery = gql`
  query ventaTarjetaPorId($id: ID!, $sucId: ID!) {
    data: ventaTarjetaPorId(id: $id, sucId: $sucId) {
      id
      estado
    }
  }
`;

export const marcarVentasTarjetaNoCompletadasMutation = gql`
  mutation marcarVentasTarjetaNoCompletadas(
    $cajaId: ID!, $sucId: ID!, $motivo: String, $observacion: String, $usuarioId: ID
  ) {
    data: marcarVentasTarjetaNoCompletadas(
      cajaId: $cajaId, sucId: $sucId, motivo: $motivo, observacion: $observacion, usuarioId: $usuarioId
    )
  }
`;

/**
 * Deja UN cobro sin conciliar, con su motivo.
 *
 * Separada de la de la caja entera porque el caso real es por cobro: de tres pendientes, dos
 * tienen su cupón y el tercero se perdió. Marcar los tres con el mismo motivo sería escribir dos
 * mentiras para registrar una verdad.
 */
export const marcarVentaTarjetaNoCompletadaMutation = gql`
  mutation marcarVentaTarjetaNoCompletada(
    $id: ID!, $sucId: ID!, $motivo: String!, $observacion: String, $usuarioId: ID
  ) {
    data: marcarVentaTarjetaNoCompletada(
      id: $id, sucId: $sucId, motivo: $motivo, observacion: $observacion, usuarioId: $usuarioId
    ) {
      id
      estado
      noCompletadoMotivo
      noCompletadoObservacion
      noCompletadoEn
      noCompletadoPor { id nickname }
    }
  }
`;

export const completarVentaTarjetaMutation = gql`
  mutation completarVentaTarjeta($input: CompletarVentaTarjetaInput!) {
    data: completarVentaTarjeta(input: $input) {
      id
      sucursalId
      estado
      codigoAutorizacion
      numeroBoleta
      montoEscaneado
      qrCrudo
    }
  }
`;

/**
 * Cobros con tarjeta de una venta ya cerrada, para poder vincular el cupón a la línea correcta.
 *
 * Va contra el FILIAL (servidor=false), que es donde vive la venta y donde corre la mutation de
 * completar. Se pide `identificadorTransaccion` porque una línea ya vinculada no puede volver a
 * ofrecerse: dos cupones sobre el mismo cobro es exactamente lo que hay que impedir.
 */
export const cobrosTarjetaDeVentaQuery = gql`
  query venta($id: ID!, $sucId: ID) {
    data: venta(id: $id, sucId: $sucId) {
      id
      cobro {
        id
        cobroDetalleList {
          id
          valor
          pago
          vuelto
          descuento
          identificadorTransaccion
          formaPago { id descripcion }
          moneda { id simbolo }
        }
      }
    }
  }
`;


/**
 * Pre-chequeo de cupon ya usado, contra el FILIAL. Devuelve el motivo o null.
 *
 * La validacion de verdad corre igual al guardar; esto solo la adelanta. Detectarlo recien en el
 * saveVenta dejaba al cajero enterandose cuando la venta ya estaba registrada y el dato escaneado
 * ya se habia descartado.
 */
/**
 * ⚠️ `codigoAutorizacion` y `terminalPosId` NO son opcionales en la práctica.
 *
 * El chequeo de duplicado por código de autorización sólo corre acotado por terminal --el código
 * lo emite el aparato y sólo es único ahí--. Sin esos dos, el adelanto sólo detectaba el duplicado
 * por `qrCrudo`, o sea únicamente los cupones que entraron por el lector: un cupón fotografiado o
 * tipeado a mano pasaba el adelanto y recién reventaba al guardar, con la venta ya hecha.
 */
export const motivoCuponNoUsableQuery = gql`
  query motivoCuponNoUsable($qrCrudo: String, $identificadorTransaccion: String,
                            $codigoAutorizacion: String, $terminalPosId: ID, $sucId: ID!) {
    data: motivoCuponNoUsable(
      qrCrudo: $qrCrudo
      identificadorTransaccion: $identificadorTransaccion
      codigoAutorizacion: $codigoAutorizacion
      terminalPosId: $terminalPosId
      sucId: $sucId
    )
  }
`;

/**
 * Ventas con tarjeta de UNA caja, paginadas y filtradas, contra el FILIAL.
 *
 * `cajaId` y `sucId` acotan el universo del lado del servidor, asi que la pantalla no puede ver
 * otra caja ni otra sucursal aunque alguien manipule los filtros.
 */
export const filtrarVentasTarjetaPorCajaQuery = gql`
  query filtrarVentasTarjetaPorCaja(
    $cajaId: ID!, $sucId: ID!, $estado: String, $terminalPosId: ID, $monedaId: ID,
    $montoDesde: Float, $montoHasta: Float, $usuarioId: ID, $page: Int, $size: Int
  ) {
    data: filtrarVentasTarjetaPorCaja(
      cajaId: $cajaId, sucId: $sucId, estado: $estado, terminalPosId: $terminalPosId,
      monedaId: $monedaId, montoDesde: $montoDesde, montoHasta: $montoHasta,
      usuarioId: $usuarioId, page: $page, size: $size
    ) {
      getContent {
        id
        sucursalId
        ventaId
        cajaId
        terminalPos { id codigo descripcion cargaManualPermitida proveedorServicio { id } moneda { id simbolo decimales } formatoTerminalPos { id nombre tipo mapeo } }
        moneda { id simbolo decimales }
        codigoAutorizacion
        numeroBoleta
        monto
        montoEscaneado
        estado
        creadoEn
        # De quien es el cobro. La consulta ya esta acotada a ESTA caja del lado del servidor, pero
        # una caja cruza turnos --se cierra cuando se cierra, no cuando cambia la persona-- asi que
        # sin esto dos cobros del mismo monto a horas parecidas son indistinguibles.
        usuario { id nickname }
        # Quien dejo el cobro sin conciliar, cuando y por que. Un NO_COMPLETADO sin esto es una
        # fila que dice que se perdio la conciliacion y no dice a quien preguntarle.
        noCompletadoMotivo
        noCompletadoObservacion
        noCompletadoEn
        noCompletadoPor { id nickname }
      }
      getTotalElements
    }
  }
`;

/**
 * Imprime la seña de un cobro con tarjeta que quedó sin cupón.
 *
 * Va contra el FILIAL, como el ticket de la venta: la impresora está ahí y `saveVenta` ya manda por
 * este mismo camino su `printerName` y su `local`.
 */
export const imprimirSenaCuponMutation = gql`
  mutation imprimirSenaCupon($input: SenaCuponInput!, $printerName: String, $local: String) {
    data: imprimirSenaCupon(input: $input, printerName: $printerName, local: $local)
  }
`;

/**
 * Un cobro con tarjeta completo, por id. Contra el FILIAL.
 *
 * Separado de `ventaTarjetaPorIdQuery` a propósito: esa trae sólo `id` y `estado` porque la usa un
 * poller que pregunta cada pocos segundos si el cupón ya llegó, y engordarla haría que ese poller
 * arrastre la terminal y su formato en cada vuelta. Ésta es para el caso contrario: una sola
 * consulta que tiene que devolver todo lo que el diálogo de completar necesita.
 *
 * La usa el escaneo de la seña: el QR puede apuntar a una fila que no está en la página cargada
 * --la tabla trae de a 15 y el filtro de cajero arranca puesto-- y buscarla sólo en memoria
 * diría "no existe" sobre un cobro que sí existe.
 */
export const ventaTarjetaCompletaPorIdQuery = gql`
  query ventaTarjetaPorId($id: ID!, $sucId: ID!) {
    data: ventaTarjetaPorId(id: $id, sucId: $sucId) {
      id
      sucursalId
      ventaId
      cajaId
      terminalPos { id codigo descripcion cargaManualPermitida proveedorServicio { id } moneda { id simbolo decimales } formatoTerminalPos { id nombre tipo mapeo } }
      moneda { id simbolo decimales }
      codigoAutorizacion
      numeroBoleta
      monto
      montoEscaneado
      estado
      creadoEn
      usuario { id nickname }
      noCompletadoMotivo
      noCompletadoObservacion
      noCompletadoEn
      noCompletadoPor { id nickname }
    }
  }
`;
