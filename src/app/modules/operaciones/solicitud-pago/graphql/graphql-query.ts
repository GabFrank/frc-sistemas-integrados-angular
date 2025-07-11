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
    pago {
      estado
      id
      programado
      creadoEn
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
    solicitudPago {
      id
    }
    autorizadoPor {
      id
      nickname
      persona {
          id
          nombre
        }
      }
    }
    recepcionMercaderiaList {
      id
      fecha
      proveedor {
        id
        persona {
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
    $estado: SolicitudPagoEstado, 
    $fechaInicio: String, 
    $fechaFin: String, 
    $page: Int, 
    $size: Int
  ) {
    data: solicitudPagoConFiltros(
      solicitudPagoId: $solicitudPagoId,
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

export const imprimirSolicitudPago = gql`
  mutation(
    $solicitudPagoId: ID!,
    $proveedorNombre: String!,
    $fechaDePago: String!,
    $formaPago: String!,
    $nominal: Boolean,
    $tipoImpresion: Boolean!,
    $printerName: String
  ) {
    data: imprimirSolicitudPago(
      solicitudPagoId: $solicitudPagoId,
      proveedorNombre: $proveedorNombre,
      fechaDePago: $fechaDePago,
      formaPago: $formaPago,
      nominal: $nominal,
      tipoImpresion: $tipoImpresion,
      printerName: $printerName
    )
  }
`; 