import gql from "graphql-tag";

export const solicitudPagoFragment = gql`
  fragment solicitudPagoFragment on SolicitudPago {
    id
    usuario {
      id
      nickname
      persona {
        id
        nombre
      }
    }
    creadoEn
    estado
    tipo
    referenciaId
    pago {
    id
    usuario {
      id
      nickname
      persona {
        id
        nombre
      }
    }
    creadoEn
    estado
    programado
    autorizadoPor {
      id
      nickname
      persona {
          id
          nombre
        }
      }
    }
  }
`;

export const solicitudPagoPorUsuarioId = gql`
  query($id: ID!) {
    data: solicitudPagoPorUsuarioId(id: $id) {
      ...solicitudPagoFragment
    }
  }
  ${solicitudPagoFragment}
`;

export const solicitudPago = gql`
  query($id: ID!) {
    data: solicitudPago(id: $id) {
      ...solicitudPagoFragment
    }
  }
  ${solicitudPagoFragment}
`;

export const solicitudPagoConFiltros = gql`
  query(
    $solicitudPagoId: ID,
    $referenciaId: ID, 
    $tipo: TipoSolicitudPago, 
    $estado: SolicitudPagoEstado, 
    $fechaInicio: String, 
    $fechaFin: String, 
    $page: Int, 
    $size: Int
  ) {
    data: solicitudPagoConFiltros(
      solicitudPagoId: $solicitudPagoId,
      referenciaId: $referenciaId,
      tipo: $tipo,
      estado: $estado,
      fechaInicio: $fechaInicio,
      fechaFin: $fechaFin,
      page: $page,
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
        ...solicitudPagoFragment
      }
    }
  }
  ${solicitudPagoFragment}
`;

export const saveSolicitudPago = gql`
  mutation($entity: SolicitudPagoInput!) {
    data: saveSolicitudPago(entity: $entity) {
      ...solicitudPagoFragment
    }
  }
  ${solicitudPagoFragment}
`; 