import gql from 'graphql-tag';

export const pagoDetalleCuotaQuery = gql`
  query pagoDetalleCuotaQuery($id: ID!) {
    data: pagoDetalleCuota(id: $id) {
      id
      pagoDetalle {
        id
      }
      referenciaId
      numeroCuota
      fechaVencimiento
      estado
      totalPagado
      totalFinal
      creadoEn
      usuario {
        id
      }
      cheque {
        id
      }
    }
  }
`;

export const pagoDetalleCuotasQuery = gql`
  query pagoDetalleCuotasQuery($page: Int, $size: Int) {
    data: pagoDetalleCuotas(page: $page, size: $size) {
      id
      pagoDetalle {
        id
      }
      referenciaId
      numeroCuota
      fechaVencimiento
      estado
      totalPagado
      totalFinal
      creadoEn
      usuario {
        id
      }
      cheque {
        id
      }
    }
  }
`;

export const pagoDetalleCuotasPorPagoDetalleIdQuery = gql`
  query pagoDetalleCuotasPorPagoDetalleIdQuery($pagoDetalleId: ID!) {
    data: pagoDetalleCuotasPorPagoDetalleId(pagoDetalleId: $pagoDetalleId) {
      id
      pagoDetalle {
        id
      }
      referenciaId
      numeroCuota
      fechaVencimiento
      estado
      totalPagado
      totalFinal
      creadoEn
      usuario {
        id
      }
      cheque {
        id
      }
    }
  }
`;

export const pagoDetalleCuotasSearchQuery = gql`
  query pagoDetalleCuotasSearchQuery($texto: String) {
    data: pagoDetalleCuotasSearch(texto: $texto) {
      id
      pagoDetalle {
        id
      }
      referenciaId
      numeroCuota
      fechaVencimiento
      estado
      totalPagado
      totalFinal
      creadoEn
      usuario {
        id
      }
      cheque {
        id
      }
    }
  }
`;

export const countPagoDetalleCuotaQuery = gql`
  query {
    data: countPagoDetalleCuota
  }
`;

export const savePagoDetalleCuota = gql`
  mutation savePagoDetalleCuota($entity: PagoDetalleCuotaInput!) {
    data: savePagoDetalleCuota(entity: $entity) {
      id
      pagoDetalle {
        id
      }
      referenciaId
      numeroCuota
      fechaVencimiento
      estado
      totalPagado
      totalFinal
      creadoEn
      usuario {
        id
      }
      cheque {
        id
      }
    }
  }
`;

export const deletePagoDetalleCuota = gql`
  mutation deletePagoDetalleCuota($id: ID!) {
    data: deletePagoDetalleCuota(id: $id)
  }
`; 