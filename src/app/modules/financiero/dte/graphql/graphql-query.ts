import gql from "graphql-tag";

export const documentosElectronicosQuery = gql`
  query (
    $page: Int
    $size: Int
    $estado: String
    $fechaDesde: String
    $fechaHasta: String
    $cdc: String
    $sucursalId: ID
  ) {
    data: documentosElectronicos(
      page: $page
      size: $size
      estado: $estado
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
      cdc: $cdc
      sucursalId: $sucursalId
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
        cdc
        estadoSifen
        urlQr
        creadoEn
        mensajeSifen
      }
    }
  }
`;

export const generarDocumentoElectronicoMutation = gql`
  mutation ($ventaId: ID!, $sucursalId: ID!, $usuarioId: ID) {
    data: generarDocumentoElectronico(ventaId: $ventaId, sucursalId: $sucursalId, usuarioId: $usuarioId) {
      id
      cdc
      estadoSifen
      urlQr
      creadoEn
    }
  }
`;

export const enviarLoteNowMutation = gql`
  mutation ($usuarioId: ID) {
    data: enviarLoteNow(usuarioId: $usuarioId) {
      id
      idProtocoloSifen
      estadoSifen
    }
  }
`;

export const consultarLotesNowMutation = gql`
  mutation {
    data: consultarLotesNow
  }
`;

export const reintentarGeneracionDteMutation = gql`
  mutation ($dteId: ID!, $usuarioId: ID) {
    data: reintentarGeneracionDte(dteId: $dteId, usuarioId: $usuarioId) {
      id
      cdc
      estadoSifen
      urlQr
      xmlFirmado
      creadoEn
    }
  }
`;

export const registrarEventoDteMutation = gql`
  mutation ($documentoElectronicoId: ID!, $tipoEvento: Int!, $usuarioId: ID, $motivo: String, $observacion: String) {
    data: registrarEventoDte(documentoElectronicoId: $documentoElectronicoId, tipoEvento: $tipoEvento, usuarioId: $usuarioId, motivo: $motivo, observacion: $observacion) {
      id
      tipoEvento
      fechaEvento
      cdcEvento
      mensajeRespuestaSifen
      motivo
      observacion
    }
  }
`;

export const eventosPorDteQuery = gql`
  query ($dteId: ID!) {
    data: eventosPorDte(dteId: $dteId) {
      id
      tipoEvento
      fechaEvento
      cdcEvento
      mensajeRespuestaSifen
      motivo
      observacion
    }
  }
`;

export const seedDteMockMutation = gql`
  mutation ($cantidad: Int, $diasAtras: Int) {
    data: seedDteMock(cantidad: $cantidad, diasAtras: $diasAtras)
  }
`;

export const wipeDteDataMutation = gql`
  mutation {
    data: wipeDteData
  }
`;

export const documentoElectronicoByIdQuery = gql`
  query ($id: ID!) {
    data: documentoElectronico(id: $id) {
      id
      cdc
      estadoSifen
      urlQr
      xmlFirmado
      creadoEn
    }
  }
`;

export const dteMetricsQuery = gql`
  query {
    data: dteMetrics {
      total
      pendientes
      generados
      enviados
      aprobados
      rechazados
      cancelados
    }
  }
`;

export const dteRechazadosRecientesQuery = gql`
  query ($limit: Int) {
    data: dteRechazadosRecientes(limit: $limit) {
      id
      cdc
      estadoSifen
      mensajeSifen
      creadoEn
    }
  }
`;


