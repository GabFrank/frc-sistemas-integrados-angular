import gql from "graphql-tag";

// Query: consolidado de devoluciones pendientes de retiro por proveedor,
// agrupado por sucursal. sucursalId es opcional (null => todas las sucursales).
export const retiroProveedorConsolidadoQuery = gql`
  query ($proveedorId: ID!, $sucursalId: ID) {
    data: retiroProveedorConsolidado(
      proveedorId: $proveedorId
      sucursalId: $sucursalId
    ) {
      proveedorId
      proveedorNombre
      fecha
      grupos {
        sucursalId
        sucursalNombre
        devolucionIds
        lineas {
          productoId
          codigo
          descripcion
          presentacion
          cantidadTotal
        }
      }
    }
  }
`;

// Query: genera el remito PDF (Base64) de las devoluciones seleccionadas.
export const remitoRetiroProveedorQuery = gql`
  query ($devolucionIds: [ID!]!) {
    data: remitoRetiroProveedor(devolucionIds: $devolucionIds)
  }
`;

// Mutation: imprime el comprobante de retiro en impresora térmica.
// anchoMm: 58 u 80. El backend deriva el layout del ancho.
export const imprimirTicketRetiroProveedorMutation = gql`
  mutation ($devolucionIds: [ID!]!, $printerName: String, $anchoMm: Int) {
    data: imprimirTicketRetiroProveedor(
      devolucionIds: $devolucionIds
      printerName: $printerName
      anchoMm: $anchoMm
    )
  }
`;

// Mutation: retira en bloque las devoluciones seleccionadas.
// Devuelve un resultado por devolución (ok/mensaje) sin frenar las demás.
export const retirarDevolucionesEnBloqueMutation = gql`
  mutation ($devolucionIds: [ID!]!, $usuarioId: ID) {
    data: retirarDevolucionesEnBloque(
      devolucionIds: $devolucionIds
      usuarioId: $usuarioId
    ) {
      resultados {
        id
        ok
        mensaje
      }
    }
  }
`;
