import gql from "graphql-tag";

export const ventasQuery = gql`
  {
    ventas {
      id
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
    }
  }
`;

export const ventaQuery = gql`
  query ($id: ID!) {
    data: venta(id: $id) {
      id
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
        cobroDetalleList{
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
        }
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
    $printerName: String
    $local: String,
    $pdvId: Int
  ) {
    data: saveVenta(
      ventaInput: $ventaInput
      ventaItemList: $ventaItemList
      cobro: $cobro
      cobroDetalleList: $cobroDetalleList
      ticket: $ticket,
      printerName: $printerName,
      local: $local,
      pdvId: $pdvId
    )
  }
`;

export const deleteVentaQuery = gql`
  mutation deleteVenta($id: ID!) {
    deleteVenta(id: $id)
  }
`;

export const cancelarVentaQuery = gql`
  mutation cancelarVenta($id: ID!) {
    data: cancelarVenta(id: $id)
  }
`;

export const reimprimirVentaQuery = gql`
  mutation reimprimirVenta(
    $id: ID!
    $printerName: String,
    $local: String
    ) {
    data: reimprimirVenta(
      id: $id
      printerName: $printerName,
      local: $local
      )
  }
`;

//ventasPorCajaId

export const ventasPorCajaIdQuery = gql`
  query ($id: ID!, $offset: Int) {
    data: ventasPorCajaId(id: $id, offset: $offset) {
      id
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
      valorDescuento
      valorTotal
      totalGs
      totalRs
      totalDs
    }
  }
`;

export const ventaPorPeriodoQuery = gql`
  query ($inicio: String, $fin: String) {
    data: ventaPorPeriodo(inicio: $inicio, fin: $fin) {
      valorGs
      valorRs
      valorDs
      valorTotalGs
      creadoEn
    }
  }
`;
