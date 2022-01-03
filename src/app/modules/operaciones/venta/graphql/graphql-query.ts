import gql from "graphql-tag";

export const ventasQuery = gql`
  {
    ventas {
      id
      cliente {
        id
      }
      formaPago
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
        precioVenta
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
      formaPago
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
        precioVenta
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

export const saveVenta = gql`
  mutation saveVenta($ventaInput:VentaInput!, $ventaItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]) {
    data: saveVenta(ventaInput:$ventaInput, ventaItemList: $ventaItemList, cobro: $cobro, cobroDetalleList: $cobroDetalleList)
  }
`;

export const deleteVentaQuery = gql`
  mutation deleteVenta($id: ID!) {
    deleteVenta(id: $id)
  }
`;
