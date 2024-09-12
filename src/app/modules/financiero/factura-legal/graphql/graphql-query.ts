import gql from "graphql-tag";

export const facturaLegalesQuery = gql`
  query (
    $page: Int
    $size: Int
    $fechaInicio: String!
    $fechaFin: String!
    $sucId: [ID]
    $ruc: String
    $nombre: String
    $iva5: Boolean
    $iva10: Boolean
  ) {
    data: facturaLegales(
      page: $page
      size: $size
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
      nombre: $nombre
      ruc: $ruc
      iva5: $iva5
      iva10: $iva10
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
        descuento
      }
    }
  }
`;

export const facturaLegalesFullInfoQuery = gql`
  query (
    $page: Int
    $size: Int
    $fechaInicio: String!
    $fechaFin: String!
    $sucId: [ID]
    $ruc: String
    $nombre: String
    $iva5: Boolean
    $iva10: Boolean
  ) {
    data: facturaLegales(
      page: $page
      size: $size
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
      nombre: $nombre
      ruc: $ruc
      iva5: $iva5
      iva10: $iva10
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
        viaTributaria
        sucursalId
        timbradoDetalle {
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
        descuento
        creadoEn
        sucursal {
          id
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
  }
`;

export const facturaLegalQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: facturaLegal(id: $id, sucId: $sucId) {
      id
      viaTributaria
      timbradoDetalle {
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
      descuento
      creadoEn
      sucursal {
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
  mutation saveFacturaLegal(
    $entity: FacturaLegalInput!
    $detalleList: [FacturaLegalItemInput]
    $printerName: String
    $pdvId: Int!
  ) {
    data: saveFacturaLegal(
      entity: $entity
      detalleList: $detalleList
      printerName: $printerName
      pdvId: $pdvId
    )
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
      facturaLegal {
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
    data: imprimirFacturasPorCaja(
      id: $id
      printerName: $printerName
      sucId: $sucId
    )
  }
`;

export const reimprimirFacturaLegalQuery = gql`
  query ($id: ID!, $sucId: ID!, $printerName: String) {
    data: reimprimirFacturaLegal(
      id: $id
      sucId: $sucId
      printerName: $printerName
    )
  }
`;

export const resumenFacturasQuery = gql`
  query (
    $fechaInicio: String!
    $fechaFin: String!
    $sucId: [ID]
    $ruc: String
    $nombre: String
    $iva5: Boolean
    $iva10: Boolean
  ) {
    data: findResumenFacturas(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
      nombre: $nombre
      ruc: $ruc
      iva5: $iva5
      iva10: $iva10
    ) {
      cantFacturas
      maxNumero
      minNumero
      totalFinal
      total5
      total10
    }
  }
`;

export const generarExcelFacturasQuery = gql`
  query (
    $fechaInicio: String!
    $fechaFin: String!
    $sucId: ID
  ) {
    data: generarExcelFacturas(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
    )
  }
`;

export const generarExcelFacturasZipQuery = gql`
  query (
    $fechaInicio: String!
    $fechaFin: String!
    $sucId: [ID]
  ) {
    data: generarExcelFacturasZip(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucId: $sucId
    )
  }
`;


