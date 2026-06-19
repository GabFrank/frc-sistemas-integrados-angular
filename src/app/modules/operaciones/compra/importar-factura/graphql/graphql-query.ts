import gql from 'graphql-tag';

// Todas las queries/mutations apuntan al servidor CENTRAL (clientName 'servidor'),
// donde vive el backend de importacion de facturas. Se aliasa el campo raiz a `data:`
// porque GenericCrudService emite res.data["data"].

export const importarFacturaProveedorMutation = gql`
  mutation importarFacturaProveedor($archivos: [ArchivoImportInput!]!, $usuarioId: Int!) {
    data: importarFacturaProveedor(archivos: $archivos, usuarioId: $usuarioId) {
      id
      estado
      origen
      nombreArchivo
      errorMensaje
      modeloIa
      tokensPrompt
      tokensRespuesta
      pedidoId
    }
  }
`;

export const facturaImportPreviewQuery = gql`
  query ($id: ID!) {
    data: facturaImportPreview(id: $id) {
      importId
      estado
      emisorRuc
      emisorNombre
      numeroFactura
      timbrado
      fechaEmision
      moneda
      totalGeneral
      sumaItems
      totalesCuadran
      totalesAdvertencia
      esLegal
      proveedorSugerido {
        id
        persona {
          id
          nombre
          documento
          apodo
        }
      }
      proveedorConfianza
      proveedorRazon
      items {
        textoOcr
        codigoOcr
        cantidad
        precioUnitario
        descuento
        totalItem
        productoSugerido {
          id
          descripcion
          codigoPrincipal
        }
        productoConfianza
        productoRazon
        candidatos {
          id
          descripcion
          codigoPrincipal
        }
      }
    }
  }
`;

export const confirmarFacturaImportMutation = gql`
  mutation confirmarFacturaImport(
    $importId: ID!
    $proveedorId: Int!
    $items: [ConfirmarFacturaImportItemInput!]!
    $tipoBoleta: String
    $crearPedido: Boolean!
    $usuarioId: Int!
  ) {
    data: confirmarFacturaImport(
      importId: $importId
      proveedorId: $proveedorId
      items: $items
      tipoBoleta: $tipoBoleta
      crearPedido: $crearPedido
      usuarioId: $usuarioId
    ) {
      id
      estado
      pedidoId
    }
  }
`;

export const facturaProveedorImportsQuery = gql`
  query ($estado: String, $page: Int, $size: Int) {
    data: facturaProveedorImports(estado: $estado, page: $page, size: $size) {
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      getContent {
        id
        origen
        estado
        nombreArchivo
        errorMensaje
        pedidoId
        modeloIa
        creadoEn
      }
    }
  }
`;
