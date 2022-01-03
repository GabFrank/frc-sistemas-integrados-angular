import gql from "graphql-tag";

export const ventaItemListQuery = gql`
  {
    ventaItemList {
      id
      venta {
        id
      }
      producto {
        id
        descripcion
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
  }
`;

export const ventaItemQuery = gql`
  query ($id: ID!) {
    data: ventaItem(id: $id) {
      id
      venta {
        id
      }
      producto {
        id
        descripcion
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
  }
`;

export const ventaItemListPorVentaIdQuery = gql`
  query ($id: ID!) {
    data: ventaItemListPorVentaId(id: $id) {
      id
      venta {
        id
      }
      producto {
        id
        descripcion
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
  }
`;

export const saveVentaItem = gql`
  mutation saveVentaItem($entity: VentaItemInput!) {
    data: saveVentaItem(ventaItem: $entity) {
      id
    }
  }
`;

export const saveVentaItemList = gql`
  mutation saveVentaItemList($entity: [VentaItemInput]) {
    data: saveVentaItemList(ventaItemList: $entity)
  }
`;



export const deleteVentaItemQuery = gql`
  mutation deleteVentaItem($id: ID!) {
    deleteVentaItem(id: $id)
  }
`;
