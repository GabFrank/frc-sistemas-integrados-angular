import gql from "graphql-tag";

export const ventaCreditosQuery = gql`
  {
    ventaCreditos {
      id
      sucursal {
        id
        nombre
      }
      venta {
        id
      }
      cliente {
        id
      }
      tipoConfirmacion
      cantidadCuotas
      valorTotal
      saldoTotal
      plazoEnDias
      interesPorDia
      interesMoraDia
      estado
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const ventaCreditoPorClienteQuery = gql`
  query ($id: ID!, $estado: EstadoVentaCredito, $page: Int, $size: Int) {
    data: ventaCreditoPorCliente(
      id: $id
      estado: $estado
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
        sucursal {
          id
          nombre
        }
        venta {
          id
          usuario {
            nickname
            persona {
              nombre
            }
          }
          sucursalId
        }
        cliente {
          id
        }
        tipoConfirmacion
        cantidadCuotas
        valorTotal
        saldoTotal
        plazoEnDias
        interesPorDia
        interesMoraDia
        estado
        creadoEn
        usuario {
          id
          nickname
        }
      }
    }
  }
`;

export const ventaCreditoQuery = gql`
  query ($id: ID!, $sucId: ID!) {
    data: ventaCredito(id: $id, sucId: $sucId) {
      id
      sucursal {
        id
        nombre
      }
      venta {
        id
      }
      cliente {
        id
      }
      tipoConfirmacion
      cantidadCuotas
      valorTotal
      saldoTotal
      plazoEnDias
      interesPorDia
      interesMoraDia
      estado
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const saveVentaCredito = gql`
  mutation saveVentaCredito(
    $entity: VentaCreditoInput!
    $detalleList: [VentaCreditoCuotaInput]!
  ) {
    data: saveVentaCredito(entity: $entity, detalleList: $detalleList) {
      id
    }
  }
`;

export const deleteVentaCreditoQuery = gql`
  mutation deleteVentaCredito($id: ID!, $sucID: ID!) {
    deleteVentaCredito(id: $id, sucId: $sucId)
  }
`;

export const cobrarVentaCreditoQuery = gql`
  mutation cobrarVentaCredito(
    $ventaCreditoInputList: [VentaCreditoInput]
    $cobroList: [CobroDetalleInput]
  ) {
    cobrarVentaCredito(
      ventaCreditoInputList: $ventaCreditoInputList
      cobroList: $cobroList
    )
  }
`;

export const imprimirVentaCreditoQuery = gql`
  query imprimirVentaCredito($id: ID!, $sucId: ID!, $printerName: String) {
    imprimirVentaCredito(id: $id, sucId: $sucId, printerName: $printerName)
  }
`;

export const ventaCreditoAuthSubQuery = gql`
  subscription ventaCreditoAuthQrSub {
    data: ventaCreditoAuthQrSub {
      clienteId
      timestamp
      sucursalId
      secretKey
    }
  }
`;

export const cancelarVentaCreditoQuery = gql`
  mutation cancelarVentaCredito($id: ID!, $sucId: ID!) {
    data: cancelarVentaCredito(id: $id, sucId: $sucId)
  }
`;

export const finalizarVentaCreditoQuery = gql`
  mutation finalizarVentaCredito($id: ID!, $sucId: ID!) {
    data: finalizarVentaCredito(id: $id, sucId: $sucId)
  }
`;

export const imprimirReciboQuery = gql`
  query imprimirRecibo(
    $clienteId: ID!
    $ventaCreditoInputList: [VentaCreditoInput]!
    $usuarioId: ID!
  ) {
    data: imprimirRecibo(
      clienteId: $clienteId
      ventaCreditoInputList: $ventaCreditoInputList
      usuarioId: $usuarioId
    )
  }
`;

export const findWithFiltersQuery = gql`
  query (
    $id: ID!
    $fechaInicio: String
    $fechaFin: String
    $estado: EstadoVentaCredito
    $cobro: Boolean
  ) {
    data: findWithFilters(
      id: $id
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      estado: $estado
      cobro: $cobro
    ) {
      # getTotalPages
      # getTotalElements
      # getNumberOfElements
      # isFirst
      # isLast
      # hasNext
      # hasPrevious
      # getMultiPageableList {
      #   tenantId
      #   offset
      #   page
      #   totalElements
      #   lastOffset
      #   lastTotalElement
      # }
      # getPageable {
      #   getPageNumber
      #   getPageSize
      # }
      # getContent {
        id
        sucursal {
          id
          nombre
        }
        venta {
          id
          usuario {
            nickname
            persona {
              nombre
            }
          }
          sucursalId
        }
        cliente {
          id
        }
        tipoConfirmacion
        cantidadCuotas
        valorTotal
        saldoTotal
        plazoEnDias
        interesPorDia
        interesMoraDia
        estado
        creadoEn
        usuario {
          id
          nickname
        }
        fechaCobro
      # }
    }
  }
`;
