import gql from "graphql-tag";

export const eventoInutilizacionQuery = gql`
  query ($id: ID!, $sucursalId: ID!) {
    data: eventoInutilizacion(id: $id, sucursalId: $sucursalId) {
      id
      sucursalId
      timbrado {
        id
        numero
        razonSocial
        isElectronico
        activo
      }
      timbradoDetalle {
        id
        puntoExpedicion
        activo
      }
      eventoId
      fechaFirma
      establecimiento
      puntoExpedicion
      numeroInicio
      numeroFin
      tipoDE
      motivoInutilizacion
      xmlEvento
      estado
      fechaProcesamiento
      protocoloAutorizacion
      codigoRespuesta
      mensajeRespuesta
      respuestaBruta
      activo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const eventosInutilizacionPorTimbradoQuery = gql`
  query ($timbradoId: ID!, $sucursalId: ID!) {
    data: eventosInutilizacionPorTimbrado(timbradoId: $timbradoId, sucursalId: $sucursalId) {
      id
      sucursalId
      timbrado {
        id
        numero
        razonSocial
      }
      timbradoDetalle {
        id
        puntoExpedicion
      }
      eventoId
      fechaFirma
      establecimiento
      puntoExpedicion
      numeroInicio
      numeroFin
      tipoDE
      motivoInutilizacion
      estado
      fechaProcesamiento
      protocoloAutorizacion
      codigoRespuesta
      mensajeRespuesta
      activo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

export const eventosInutilizacionPorEstadoQuery = gql`
  query ($estado: EstadoEvento!, $sucursalId: ID!) {
    data: eventosInutilizacionPorEstado(estado: $estado, sucursalId: $sucursalId) {
      id
      sucursalId
      timbrado {
        id
        numero
        razonSocial
      }
      timbradoDetalle {
        id
        puntoExpedicion
      }
      eventoId
      fechaFirma
      establecimiento
      puntoExpedicion
      numeroInicio
      numeroFin
      tipoDE
      motivoInutilizacion
      estado
      fechaProcesamiento
      protocoloAutorizacion
      codigoRespuesta
      mensajeRespuesta
      activo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

export const eventosInutilizacionPorSucursalQuery = gql`
  query ($sucursalId: ID!) {
    data: eventosInutilizacionPorSucursal(sucursalId: $sucursalId) {
      id
      sucursalId
      timbrado {
        id
        numero
        razonSocial
        isElectronico
        activo
      }
      timbradoDetalle {
        id
        puntoExpedicion
        activo
      }
      eventoId
      fechaFirma
      establecimiento
      puntoExpedicion
      numeroInicio
      numeroFin
      tipoDE
      motivoInutilizacion
      estado
      fechaProcesamiento
      protocoloAutorizacion
      codigoRespuesta
      mensajeRespuesta
      activo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const eventosInutilizacionConFiltrosQuery = gql`
  query (
    $sucursalId: ID
    $timbradoId: ID
    $estado: EstadoEvento
    $fechaInicio: String
    $fechaFin: String
    $page: Int
    $size: Int
  ) {
    data: eventosInutilizacionConFiltros(
      sucursalId: $sucursalId
      timbradoId: $timbradoId
      estado: $estado
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
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
        timbrado {
          id
          numero
          razonSocial
          isElectronico
          activo
        }
        timbradoDetalle {
          id
          puntoExpedicion
          activo
        }
        eventoId
        fechaFirma
        establecimiento
        puntoExpedicion
        numeroInicio
        numeroFin
        tipoDE
        motivoInutilizacion
        estado
        fechaProcesamiento
        protocoloAutorizacion
        codigoRespuesta
        mensajeRespuesta
        activo
        creadoEn
        actualizadoEn
        usuario {
          id
          nickname
        }
        sucursal {
          id
          nombre
        }
      }
      getPageable {
        getPageNumber
        getPageSize
      }
    }
  }
`;

export const inutilizarNumerosMutation = gql`
  mutation (
    $timbradoId: ID!
    $establecimiento: String!
    $puntoExpedicion: String!
    $numeroInicio: Int!
    $numeroFin: Int!
    $motivo: String!
    $sucursalId: ID!
    $timbradoDetalleId: ID
  ) {
    data: inutilizarNumeros(
      timbradoId: $timbradoId
      establecimiento: $establecimiento
      puntoExpedicion: $puntoExpedicion
      numeroInicio: $numeroInicio
      numeroFin: $numeroFin
      motivo: $motivo
      sucursalId: $sucursalId
      timbradoDetalleId: $timbradoDetalleId
    ) {
      id
      sucursalId
      timbrado {
        id
        numero
        razonSocial
      }
      timbradoDetalle {
        id
        puntoExpedicion
      }
      eventoId
      fechaFirma
      establecimiento
      puntoExpedicion
      numeroInicio
      numeroFin
      tipoDE
      motivoInutilizacion
      estado
      fechaProcesamiento
      protocoloAutorizacion
      codigoRespuesta
      mensajeRespuesta
      activo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

