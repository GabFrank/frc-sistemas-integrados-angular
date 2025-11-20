import { gql } from "apollo-angular";

export const facturaLegalesQuery = gql`
  query facturaLegales(
    $page: Int
    $size: Int
    $sucId: [ID]
    $fechaInicio: String
    $fechaFin: String
    $ruc: String
    $nombre: String
    $iva5: Boolean
    $iva10: Boolean
    $isElectronico: Boolean
    $activo: Boolean
  ) {
    data: facturaLegales(
      page: $page
      size: $size
      sucId: $sucId
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      ruc: $ruc
      nombre: $nombre
      iva5: $iva5
      iva10: $iva10
      isElectronico: $isElectronico
      activo: $activo
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
        nombre
        ruc
        cdc
        totalFinal
        creadoEn
        activo
        numeroFactura
        sucursal {
          id
          nombre
          codigoEstablecimientoFactura
        }
        timbradoDetalle {
          id
          puntoExpedicion
        }
        cliente {
          id
          persona {
            nombre
            documento
          }
        }
        documentoElectronico {
          id
          cdc
          estado
        }
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
            isElectronico
          }
          puntoExpedicion
        }
        numeroFactura
        cliente {
          id
          persona {
            nombre
            documento
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
        cdc
        ivaParcial0
        ivaParcial5
        ivaParcial10
        totalParcial0
        totalParcial5
        totalParcial10
        totalFinal
        descuento
        activo
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
        documentoElectronico {
          id
          cdc
          estado
        }
        facturaLegalItemList {
          id
          ventaItem {
            id
          }
          cantidad
          descripcion
          unidadMedida
          precioUnitario
          iva
          total
          creadoEn
          producto {
            id
            descripcion
          }
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
          isElectronico
        }
        puntoExpedicion
      }
      numeroFactura
      cliente {
        id
        persona {
          nombre
          documento
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
      cdc
      ivaParcial0
      ivaParcial5
      ivaParcial10
      totalParcial0
      totalParcial5
      totalParcial10
      totalFinal
      descuento
      activo
      creadoEn
      sucursalId
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
      documentoElectronico {
        id
        cdc
        estado
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
        producto {
          id
          descripcion
        }
      }
    }
  }
`;
// this returns TimbradoDetalle
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
    ) {
        id
        timbrado {
          numero
          fechaInicio
          fechaFin
        }
        rangoDesde
        rangoHasta
        numeroActual
      }
  }
`;

export const deleteFacturaLegalQuery = gql`
  mutation deleteFacturaLegal($id: ID!, $sucId: ID) {
    data: deleteFacturaLegal(id: $id, sucId: $sucId)
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
      unidadMedida
      precioUnitario
      iva
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

export const saveFacturaLegalToFilialQuery = gql`
  mutation saveFacturaLegalToFilial(
    $entity: FacturaLegalInput!
    $detalleList: [FacturaLegalItemInput]
    $sucursalId: ID!
    $timbradoDetalleId: ID!
    $monedaId: ID
    $tipoCambio: Float
  ) {
    data: saveFacturaLegalToFilial(
      entity: $entity
      detalleList: $detalleList
      sucursalId: $sucursalId
      timbradoDetalleId: $timbradoDetalleId
      monedaId: $monedaId
      tipoCambio: $tipoCambio
    ) {
      facturaId
      numeroFactura
      cdc
      urlQr
      estadoDocumentoElectronico
      mensajeRespuestaSifen
      documentoElectronicoGenerado
    }
  }
`;


