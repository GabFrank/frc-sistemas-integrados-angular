import gql from "graphql-tag";

export const facturaLegalesQuery = gql`
  {
    data: facturaLegales {
      id
      timbrado
      nroSucursal
      nroFactura
      cliente{
        persona {
          id
          documento
          direccion
        }
      }
      venta{
        id
        valorTotal
        totalGs
      }
      fecha
      credito
      nombre
      ruc
      direccion
      ivaParcial0
      ivaParcial5
      ivaParcial10
      totalParcial0
      totalParcial5
      totalParcial10
      totalFinal
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const facturaLegalQuery = gql`
  query ($id: ID!) {
    data: facturaLegal(id: $id) {
      id
      timbrado
      nroSucursal
      nroFactura
      cliente{
        persona {
          id
          documento
          direccion
        }
      }
      venta{
        id
        valorTotal
        totalGs
      }
      fecha
      credito
      nombre
      ruc
      direccion
      ivaParcial0
      ivaParcial5
      ivaParcial10
      totalParcial0
      totalParcial5
      totalParcial10
      totalFinal
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveFacturaLegal = gql`
  mutation saveFacturaLegal($entity: FacturaLegalInput!) {
    data: saveFacturaLegal(facturaLegal: $entity) {
      id
      timbrado
      nroSucursal
      nroFactura
      cliente{
        persona {
          id
          documento
          direccion
        }
      }
      venta{
        id
        valorTotal
        totalGs
      }
      fecha
      credito
      nombre
      ruc
      direccion
      ivaParcial0
      ivaParcial5
      ivaParcial10
      totalParcial0
      totalParcial5
      totalParcial10
      totalFinal
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteFacturaLegalQuery = gql`
  mutation deleteFacturaLegal($id: ID!) {
    deleteFacturaLegal(id: $id)
  }
`;

export const saveFacturaLegalItem = gql`
  mutation saveFacturaLegalItem($entity: FacturaLegalItemInput!) {
    data: saveFacturaLegalItem(facturaLegalItem: $entity) {
      id
      facturaLegal{
        id
      }
      ventaItem {
        id
      }
      cantidad
      descripcion
      precioUnitario
      total
      creadoEn
      usuario
    }
  }
`;
