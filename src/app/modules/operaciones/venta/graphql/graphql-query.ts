import gql from "graphql-tag";

export const ventasQuery = gql`
  {
    ventas {
      id
      cliente {
        id
      }
      formaPago{
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
        precioVenta{precio}
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
      formaPago{
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
        precioVenta{precio}
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

export const cancelarVentaQuery = gql`
  mutation cancelarVenta($id: ID!) {
    data: cancelarVenta(id: $id)
  }
`;

export const reimprimirVentaQuery = gql`
  mutation reimprimirVenta($id: ID!) {
    data: reimprimirVenta(id: $id)
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
      formaPago{
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
        precioVenta{precio}
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



