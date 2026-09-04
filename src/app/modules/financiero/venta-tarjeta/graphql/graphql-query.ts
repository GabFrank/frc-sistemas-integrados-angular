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
        terminalPos { id codigo descripcion proveedorServicio { id } moneda { id simbolo decimales } }
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
  mutation marcarVentasTarjetaNoCompletadas($cajaId: ID!, $sucId: ID!) {
    data: marcarVentasTarjetaNoCompletadas(cajaId: $cajaId, sucId: $sucId)
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
