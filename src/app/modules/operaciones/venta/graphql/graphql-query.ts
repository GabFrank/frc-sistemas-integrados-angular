import gql from "graphql-tag";

export const ventasQuery = gql`
  query ($sucId: ID) {
    data: ventas(sucId: $sucId) {
      id
      sucursalId
      cliente {
        id
      }
      formaPago {
        id
        descripcion
      }
      estado
      creadoEn
      usuario {
        id
      }
      ventaItemList {
        id
        producto {
          id
        }
        cantidad
        precioCosto
        precioVenta {
          precio
        }
        precio
        valorDescuento
        unidadMedida
        creadoEn
        usuario {
          id
        }
        sucursalId
        valorTotal
      }
      valorDescuento
      valorTotal
      totalGs
      totalRs
      totalDs
    }
  }
`;

export const ventaQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: venta(id: $id, sucId: $sucId) {
      id
      sucursalId
      cliente {
        id
      }
      formaPago {
        id
        descripcion
      }
      caja {
        id
      }
      estado
      creadoEn
      usuario {
        id
      }
      ventaItemList {
        id
        sucursalId
        producto {
          id
          descripcion
          isEnvase
        }
        presentacion {
          cantidad
        }
        cantidad
        precioCosto
        precioVenta {
          precio
          tipoPrecio {
            descripcion
          }
        }
        precio
        valorDescuento
        unidadMedida
        creadoEn
        usuario {
          id
        }
        valorTotal
      }
      valorDescuento
      valorTotal
      totalGs
      totalRs
      totalDs
      cobro {
        id
        cobroDetalleList {
          id
          moneda {
            denominacion
          }
          valor
          cambio
          formaPago {
            descripcion
          }
          descuento
          aumento
          vuelto
          pago
          identificadorTransaccion
        }
      }
      delivery {
        id
        precio {
          valor
        }
        estado
      }
    }
  }
`;

export const saveVenta = gql`
  mutation saveVenta(
    $ventaInput: VentaInput!
    $ventaItemList: [VentaItemInput]
    $cobro: CobroInput
    $cobroDetalleList: [CobroDetalleInput]
    $ticket: Boolean
    $facturar: Boolean
    $printerName: String
    $local: String
    $pdvId: Int
    $ventaCreditoInput: VentaCreditoInput
    $ventaCreditoCuotaInputList: [VentaCreditoCuotaInput]
  ) {
    data: saveVenta(
      ventaInput: $ventaInput
      ventaItemList: $ventaItemList
      cobro: $cobro
      cobroDetalleList: $cobroDetalleList
      ticket: $ticket
      facturar: $facturar
      printerName: $printerName
      local: $local
      pdvId: $pdvId
      ventaCreditoInput: $ventaCreditoInput
      ventaCreditoCuotaInputList: $ventaCreditoCuotaInputList
    ) {
      id
    }
  }
`;

export const saveVentaDelivery = gql`
  mutation saveVentaDelivery(
    $ventaInput: VentaInput!
    $deliveryInput: DeliveryInput!
    $cobroDetalleList: [CobroDetalleInput]
    $ventaCreditoInput: VentaCreditoInput
    $ventaCreditoCuotaInputList: [VentaCreditoCuotaInput]
  ) {
    data: saveVentaDelivery(
      ventaInput: $ventaInput
      deliveryInput: $deliveryInput
      cobroDetalleList: $cobroDetalleList
      ventaCreditoInput: $ventaCreditoInput
      ventaCreditoCuotaInputList: $ventaCreditoCuotaInputList
    ) {
      id
    }
  }
`;

export const deleteVentaQuery = gql`
  mutation deleteVenta($id: ID!, $sucId: ID) {
    deleteVenta(id: $id, sucId: $sucId)
  }
`;

export const deleteVentaItemQuery = gql`
  mutation deleteVentaItem($id: ID!, $sucId: ID) {
    deleteVentaItem(id: $id, sucId: $sucId)
  }
`;

export const cancelarVentaQuery = gql`
  mutation cancelarVenta($id: ID!, $sucId: ID) {
    data: cancelarVenta(id: $id, sucId: $sucId)
  }
`;

export const imprimirPagareQuery = gql`
  mutation imprimirPagare(
    $id: ID!
    $itens: [VentaCreditoCuotaInput]!
    $printerName: String
    $local: String
    $sucId: ID
  ) {
    data: imprimirPagare(
      id: $id
      itens: $itens
      printerName: $printerName
      local: $local
      sucId: $sucId
    )
  }
`;

export const reimprimirVentaQuery = gql`
  mutation reimprimirVenta(
    $id: ID!
    $printerName: String
    $local: String
    $sucId: ID
  ) {
    data: reimprimirVenta(
      id: $id
      printerName: $printerName
      local: $local
      sucId: $sucId
    )
  }
`;

//ventasPorCajaId

export const ventasPorCajaIdQuery = gql`
  query (
    $idVenta: ID
    $idCaja: ID!
    $page: Int
    $size: Int
    $asc: Boolean
    $sucId: ID
    $formaPago: ID
    $estado: VentaEstado
    $isDelivery: Boolean
    $monedaId: Int
  ) {
    data: ventasPorCajaId(
      idVenta: $idVenta
      idCaja: $idCaja
      page: $page
      size: $size
      asc: $asc
      sucId: $sucId
      formaPago: $formaPago
      estado: $estado
      isDelivery: $isDelivery
      monedaId: $monedaId
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
        cliente {
          id
          persona {
            nombre
          }
        }
        estado
        creadoEn
        totalGs
        totalRs
        totalDs
        delivery {
          id
          precio {
            valor
          }
          estado
        }
      }
    }
  }
`;

export const ventaPorPeriodoQuery = gql`
  query ($inicio: String, $fin: String, $sucId: ID) {
    data: ventaPorPeriodo(inicio: $inicio, fin: $fin, sucId: $sucId) {
      valorGs
      valorRs
      valorDs
      valorTotalGs
      creadoEn
    }
  }
`;

export const countVentaQuery = gql`
  {
    data: countVenta
  }
`;

export const saveVentaItemQuery = gql`
  mutation saveVentaItem($entity: VentaItemInput!) {
    data: saveVentaItem(entity: $entity) {
      id
      sucursalId
    }
  }
`;

export const saveCobroDetalleQuery = gql`
  mutation saveCobroDetalle($entity: CobroDetalleInput!) {
    data: saveCobroDetalle(entity: $entity) {
      id
    }
  }
`;

export const deleteCobroDetalleQuery = gql`
  mutation deleteCobroDetalle($id: ID!, $sucId: ID) {
    deleteCobroDetalle(id: $id, sucId: $sucId)
  }
`;

export const ventaItemQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: ventaItem(id: $id, sucId: $sucId) {
      id
      sucursalId
      venta {
        id
        sucursalId
      }
    }
  }
`;
