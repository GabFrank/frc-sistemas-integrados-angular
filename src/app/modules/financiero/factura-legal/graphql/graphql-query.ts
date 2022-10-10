import gql from "graphql-tag";

export const facturaLegalesQuery = gql`
  query ($sucId: ID){
    data: facturaLegales(sucId: $sucId) {
      id
      sucursalId
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
  query ($id: ID!, $sucId: ID) {
    data: facturaLegal(id: $id, sucId: $sucId) {
      id
      sucursalId
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
  mutation saveFacturaLegal($entity:FacturaLegalInput!, $detalleList: [FacturaLegalItemInput], $printerName: String, $pdvId: Int!) {
    data: saveFacturaLegal(entity: $entity, detalleList: $detalleList, printerName: $printerName, pdvId: $pdvId)
  }
`;

export const deleteFacturaLegalQuery = gql`
  mutation deleteFacturaLegal($id: ID!, $sucId: ID) {
    deleteFacturaLegal(id: $id, sucId: $sucId)
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

export const imprimirFacturasPorCajaQuery = gql`
  query ($id: Int, $printerName: String, $sucId: ID) {
    data: imprimirFacturasPorCaja(id: $id, printerName: $printerName, sucId: $sucId)
  }
`;


