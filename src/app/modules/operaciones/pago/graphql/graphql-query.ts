import gql from "graphql-tag";

export const pagoFragment = gql`
  fragment pagoFragment on Pago {
    id
    usuario {
      id
      nickname
      persona {
        id
        nombre
      }
    }
    autorizadoPor {
      id
      nickname
      persona {
        id
        nombre
      }
    }
    solicitudPago {
      id
      estado
      tipo
      referenciaId
    }
    creadoEn
    estado
    programado
  }
`;

export const notaRecepcionFragment = gql`
  fragment notaRecepcionFragment on NotaRecepcion {
    id
    valor
    descuento
    pagado
    numero
    timbrado
    creadoEn
    fecha
    tipoBoleta
    documento {
      id
      descripcion
    }
    usuario {
      id
      nickname
    }
    pedido {
      id
      moneda {
        id
      }
      formaPago {
        id
      }
    }
    compra {
      id
    }
  }
`;

export const pago = gql`
  query($id: ID!) {
    data: pago(id: $id) {
      ...pagoFragment
    }
  }
  ${pagoFragment}
`;

export const pagoConFiltros = gql`
  query(
    $pagoId: ID,
    $solicitudPagoId: ID,
    $estado: PagoEstado, 
    $programado: Boolean,
    $fechaInicio: String, 
    $fechaFin: String, 
    $page: Int, 
    $size: Int
  ) {
    data: pagoConFiltros(
      pagoId: $pagoId,
      solicitudPagoId: $solicitudPagoId,
      estado: $estado,
      programado: $programado,
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
        ...pagoFragment
      }
      getPageable {
        offset
        pageNumber
        pageSize
      }
    }
  }
  ${pagoFragment}
`;

export const savePago = gql`
  mutation($entity: PagoInput!) {
    data: savePago(entity: $entity) {
      ...pagoFragment
    }
  }
  ${pagoFragment}
`;

export const notaRecepcionPorNotaRecepcionAgrupadaId = gql`
  query($id: ID!) {
    data: notaRecepcionPorNotaRecepcionAgrupadaId(id: $id) {
      ...notaRecepcionFragment
    }
  }
  ${notaRecepcionFragment}
`; 