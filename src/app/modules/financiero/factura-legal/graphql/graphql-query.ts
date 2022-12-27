import gql from "graphql-tag";

export const facturaLegalesQuery = gql`
  query (
    $fechaInicio: String!, 
    $fechaFin: String!, 
    $sucId: [ID], 
    $ruc: String, 
    $nombre: String, 
    $iva5: Boolean, 
    $iva10: Boolean
    ){
    data: facturaLegales(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
      nombre: $nombre
      ruc: $ruc
      iva5: $iva5
      iva10: $iva10
      ) {
        id
        viaTributaria
        numeroFactura
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
        sucursalId
    }
  }
`;

export const facturaLegalesFullInfoQuery = gql`
  query (
    $fechaInicio: String!, 
    $fechaFin: String!, 
    $sucId: [ID], 
    $ruc: String, 
    $nombre: String, 
    $iva5: Boolean, 
    $iva10: Boolean
    ){
    data: facturaLegales(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
      nombre: $nombre
      ruc: $ruc
      iva5: $iva5
      iva10: $iva10
      ) {
        id
      viaTributaria
      timbradoDetalle{
        id
        timbrado {
          numero
        }
        puntoExpedicion
      }
      numeroFactura
      cliente {
        id
        persona {
          nombre
        }
      }
      venta {
        id
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
      sucursal{
        nombre
        codigoEstablecimientoFactura
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      facturaLegalItemList {
        id
        ventaItem {
          id
        }
        cantidad
        descripcion
        precioUnitario
        total
        creadoEn
      }
    }
  }
`;

export const facturaLegalQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: facturaLegal(id: $id, sucId: $sucId) {
      id
      viaTributaria
      timbradoDetalle{
        id
        timbrado {
          numero
        }
        puntoExpedicion
      }
      numeroFactura
      cliente {
        id
        persona {
          nombre
        }
      }
      venta {
        id
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
      sucursal{
        nombre
        codigoEstablecimientoFactura
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      facturaLegalItemList {
        id
        ventaItem {
          id
        }
        cantidad
        descripcion
        precioUnitario
        total
        creadoEn
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


