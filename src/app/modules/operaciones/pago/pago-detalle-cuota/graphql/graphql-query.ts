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
      proveedor {
        id
        persona {
          id
          nombre
        }
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
        sucursal {
          id
          nombre
        }
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
      proveedor {
        id
        persona {
          id
          nombre
        }
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
      proveedor {
        id
        persona {
          id
          nombre
        }
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
      proveedor {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const countPagoDetalleCuotaQuery = gql`
  query {
    data: countPagoDetalleCuota
  }
`;

export const pagoDetalleCuotasFiltradoQuery = gql`
  query pagoDetalleCuotasFiltradoQuery(
    $estado: String, 
    $sucursalId: Int, 
    $fechaDesde: String, 
    $fechaHasta: String,
    $page: Int,
    $size: Int,
    $filtrarPorCreacion: Boolean
  ) {
    data: getPagoDetalleCuotasFiltrado(
      estado: $estado, 
      sucursalId: $sucursalId, 
      fechaDesde: $fechaDesde, 
      fechaHasta: $fechaHasta,
      page: $page,
      size: $size,
      filtrarPorCreacion: $filtrarPorCreacion
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
        pagoDetalle {
          id
          sucursal {
            id
            nombre
          }
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
        proveedor {
          id
          persona {
            id
            nombre
          }
        }
      }
    }
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
      proveedor {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const deletePagoDetalleCuota = gql`
  mutation deletePagoDetalleCuota($id: ID!) {
    data: deletePagoDetalleCuota(id: $id)
  }
`; 