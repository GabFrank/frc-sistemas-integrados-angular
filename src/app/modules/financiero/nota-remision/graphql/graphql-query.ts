import gql from 'graphql-tag';

/** Campos que la lista y el detalle necesitan. El snapshot ya trae receptor, vehículo y chofer. */
const CAMPOS_NOTA_REMISION = `
  id
  sucursalId
  timbradoDetalleId
  numeroNotaRemision
  fecha
  origen
  transferenciaId
  facturaLegalId
  motivoEmision
  responsableEmision
  kmEstimado
  fechaInicioTraslado
  fechaFinTraslado
  fechaEstimadaFactura
  clienteId
  receptorNombre
  receptorRuc
  receptorDireccion
  receptorDepartamento
  receptorCodigoCiudad
  receptorCiudad
  salidaDireccion
  salidaDepartamento
  salidaCodigoCiudad
  salidaCiudad
  entregaDireccion
  entregaDepartamento
  entregaCodigoCiudad
  entregaCiudad
  tipoTransporte
  modalidadTransporte
  transportistaNombre
  transportistaRuc
  transportistaDireccion
  vehiculoId
  vehiculoMarca
  vehiculoMatricula
  choferPersonaId
  choferNombre
  choferDocumento
  choferDireccion
  activo
  creadoEn
`;

const CAMPOS_ITEM = `
  id
  sucursalId
  notaRemisionId
  productoId
  presentacionId
  codigo
  descripcion
  cantidad
  unidadMedida
`;

export const notaRemisionesQuery = gql`
  query notaRemisiones($sucursalId: ID, $fechaInicio: String, $fechaFin: String, $page: Int!, $size: Int!) {
    data: notaRemisiones(sucursalId: $sucursalId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getContent { ${CAMPOS_NOTA_REMISION} }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
    }
  }
`;

export const notaRemisionQuery = gql`
  query notaRemision($id: ID!, $sucursalId: ID!) {
    data: notaRemision(id: $id, sucursalId: $sucursalId) { ${CAMPOS_NOTA_REMISION} }
  }
`;

export const notaRemisionItemsQuery = gql`
  query notaRemisionItems($notaRemisionId: ID!, $sucursalId: ID!) {
    data: notaRemisionItems(notaRemisionId: $notaRemisionId, sucursalId: $sucursalId) { ${CAMPOS_ITEM} }
  }
`;

export const notaRemisionPorTransferenciaQuery = gql`
  query notaRemisionPorTransferencia($transferenciaId: ID!) {
    data: notaRemisionPorTransferencia(transferenciaId: $transferenciaId) {
      id
      sucursalId
      numeroNotaRemision
      activo
    }
  }
`;

export const documentoElectronicoDeNotaRemisionQuery = gql`
  query documentoElectronicoDeNotaRemision($notaRemisionId: ID!, $sucursalId: ID!) {
    data: documentoElectronicoDeNotaRemision(notaRemisionId: $notaRemisionId, sucursalId: $sucursalId) {
      id
      cdc
      estado
      urlQr
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const prellenarNotaRemisionQuery = gql`
  query prellenarNotaRemision($origen: String!, $referenciaId: ID, $sucursalId: ID!) {
    data: prellenarNotaRemision(origen: $origen, referenciaId: $referenciaId, sucursalId: $sucursalId) {
      notaRemision { ${CAMPOS_NOTA_REMISION} }
      items { ${CAMPOS_ITEM} }
    }
  }
`;

export const imprimirNotaRemisionQuery = gql`
  query imprimirNotaRemision($id: ID!, $sucursalId: ID!, $anchoMm: Int, $escpos: Boolean) {
    data: imprimirNotaRemision(id: $id, sucursalId: $sucursalId, anchoMm: $anchoMm, escpos: $escpos)
  }
`;

export const saveNotaRemisionMutation = gql`
  mutation saveNotaRemision($input: NotaRemisionInput!, $items: [NotaRemisionItemInput!]!) {
    data: saveNotaRemision(input: $input, items: $items) { ${CAMPOS_NOTA_REMISION} }
  }
`;

export const generarYEnviarNotaRemisionMutation = gql`
  mutation generarYEnviarNotaRemision($id: ID!, $sucursalId: ID!) {
    data: generarYEnviarNotaRemision(id: $id, sucursalId: $sucursalId) {
      id
      cdc
      estado
      urlQr
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const reenviarNotaRemisionMutation = gql`
  mutation reenviarNotaRemision($id: ID!, $sucursalId: ID!) {
    data: reenviarNotaRemision(id: $id, sucursalId: $sucursalId) {
      id
      cdc
      estado
      codigoRespuestaSifen
      mensajeRespuestaSifen
    }
  }
`;

export const anularNotaRemisionMutation = gql`
  mutation anularNotaRemision($id: ID!, $sucursalId: ID!) {
    data: anularNotaRemision(id: $id, sucursalId: $sucursalId) {
      id
      activo
    }
  }
`;
