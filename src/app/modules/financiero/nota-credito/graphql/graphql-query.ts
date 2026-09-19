import gql from 'graphql-tag';

const CAMPOS_NOTA_CREDITO = `
  id
  sucursalId
  timbradoDetalleId
  numeroNotaCredito
  fecha
  facturaLegalId
  motivoEmision
  descripcionMotivo
  clienteId
  nombre
  ruc
  direccion
  monedaExtranjera
  tipoCambio
  ivaParcial0
  ivaParcial5
  ivaParcial10
  totalParcial0
  totalParcial5
  totalParcial10
  descuento
  totalFinal
  activo
  creadoEn
`;

const CAMPOS_ITEM = `
  id
  sucursalId
  notaCreditoId
  facturaLegalItemId
  productoId
  presentacionId
  descripcion
  cantidad
  unidadMedida
  precioUnitario
  total
  iva
`;

export const notaCreditosQuery = gql`
  query notaCreditos($sucursalId: ID, $fechaInicio: String, $fechaFin: String, $page: Int!, $size: Int!) {
    data: notaCreditos(sucursalId: $sucursalId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getContent { ${CAMPOS_NOTA_CREDITO} }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
    }
  }
`;

export const notaCreditoItemsQuery = gql`
  query notaCreditoItems($notaCreditoId: ID!, $sucursalId: ID!) {
    data: notaCreditoItems(notaCreditoId: $notaCreditoId, sucursalId: $sucursalId) { ${CAMPOS_ITEM} }
  }
`;

export const notaCreditosPorFacturaQuery = gql`
  query notaCreditosPorFactura($facturaLegalId: ID!, $sucursalId: ID!) {
    data: notaCreditosPorFactura(facturaLegalId: $facturaLegalId, sucursalId: $sucursalId) {
      id
      numeroNotaCredito
      totalFinal
      activo
    }
  }
`;

export const documentoElectronicoDeNotaCreditoQuery = gql`
  query documentoElectronicoDeNotaCredito($notaCreditoId: ID!, $sucursalId: ID!) {
    data: documentoElectronicoDeNotaCredito(notaCreditoId: $notaCreditoId, sucursalId: $sucursalId) {
      id
      cdc
      estado
      urlQr
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const imprimirNotaCreditoQuery = gql`
  query imprimirNotaCredito($id: ID!, $sucursalId: ID!, $anchoMm: Int, $escpos: Boolean) {
    data: imprimirNotaCredito(id: $id, sucursalId: $sucursalId, anchoMm: $anchoMm, escpos: $escpos)
  }
`;

export const crearNotaCreditoDesdeFacturaMutation = gql`
  mutation crearNotaCreditoDesdeFactura($facturaLegalId: ID!, $sucursalId: ID!, $motivo: String!, $descripcionMotivo: String, $usuarioId: ID) {
    data: crearNotaCreditoDesdeFactura(facturaLegalId: $facturaLegalId, sucursalId: $sucursalId, motivo: $motivo, descripcionMotivo: $descripcionMotivo, usuarioId: $usuarioId) {
      ${CAMPOS_NOTA_CREDITO}
    }
  }
`;

export const generarYEnviarNotaCreditoMutation = gql`
  mutation generarYEnviarNotaCredito($id: ID!, $sucursalId: ID!) {
    data: generarYEnviarNotaCredito(id: $id, sucursalId: $sucursalId) {
      id
      cdc
      estado
      urlQr
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const reenviarNotaCreditoMutation = gql`
  mutation reenviarNotaCredito($id: ID!, $sucursalId: ID!) {
    data: reenviarNotaCredito(id: $id, sucursalId: $sucursalId) {
      id
      cdc
      estado
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const anularNotaCreditoMutation = gql`
  mutation anularNotaCredito($id: ID!, $sucursalId: ID!) {
    data: anularNotaCredito(id: $id, sucursalId: $sucursalId) {
      id
      activo
    }
  }
`;

/** Facturas que hoy admiten nota de crédito: el central ya filtra los cinco requisitos. */
export const facturasParaNotaCreditoQuery = gql`
  query facturasParaNotaCredito($sucursalId: ID, $numero: String, $page: Int!, $size: Int!) {
    data: facturasParaNotaCredito(sucursalId: $sucursalId, numero: $numero, page: $page, size: $size) {
      facturaLegalId
      sucursalId
      numeroFactura
      fecha
      cliente
      ruc
      total
      moneda
      sucursal
    }
  }
`;
