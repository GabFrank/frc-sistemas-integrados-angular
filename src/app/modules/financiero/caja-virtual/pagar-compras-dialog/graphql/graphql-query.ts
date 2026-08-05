import gql from 'graphql-tag';

export const solicitudesPagoPendientesQuery = gql`
  query ($proveedorId: ID) {
    data: solicitudesPagoPendientes(proveedorId: $proveedorId) {
      id
      numeroSolicitud
      fechaSolicitud
      montoTotal
      montoPagado
      estado
      proveedor { id persona { id nombre } }
      moneda { id denominacion simbolo principal decimales }
    }
  }
`;

export const pagarSolicitudesLoteCajaMayorMutation = gql`
  mutation ($cajaVirtualId: ID!, $pagos: [PagoLoteInput!]!) {
    data: pagarSolicitudesLoteCajaMayor(cajaVirtualId: $cajaVirtualId, pagos: $pagos) {
      id
      estado
    }
  }
`;

export const pagarSolicitudesMixtoMutation = gql`
  mutation ($pagos: [SolicitudConLineasInput!]!) {
    data: pagarSolicitudesMixto(pagos: $pagos) {
      id
      estado
    }
  }
`;

export const anularPagoCppMutation = gql`
  mutation ($pagoId: ID!, $motivo: String) {
    data: anularPagoCpp(pagoId: $pagoId, motivo: $motivo) {
      id
      estado
    }
  }
`;
