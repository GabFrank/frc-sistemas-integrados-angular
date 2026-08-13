import gql from "graphql-tag";

const opFields = `
  id
  fecha
  estado
`;

const lineaFields = `
  devoluciones {
    id
    identificador
    estado
    sucursalOrigen { nombre }
  }
`;

export const retirosDevolucionQuery = gql`
  query ($fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: retirosDevolucion(fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getTotalElements
      getTotalPages
      hasNext
      getContent {
        ${opFields}
        proveedor { id persona { nombre } }
        notaCredito { id nroNotaCredito estado montoTotal }
        ${lineaFields}
      }
    }
  }
`;

export const colectasDevolucionQuery = gql`
  query ($fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: colectasDevolucion(fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getTotalElements
      getTotalPages
      hasNext
      getContent {
        ${opFields}
        sucursalOrigen { id nombre }
        sucursalDestino { id nombre }
        ${lineaFields}
      }
    }
  }
`;

export const remitoRetiroQuery = gql`
  query ($retiroId: ID!) {
    data: remitoRetiro(retiroId: $retiroId)
  }
`;

export const revertirEstadoDevolucionMutation = gql`
  mutation ($devolucionId: ID!, $usuarioId: ID) {
    data: revertirEstadoDevolucion(devolucionId: $devolucionId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const revertirRetiroDevolucionMutation = gql`
  mutation ($retiroId: ID!, $usuarioId: ID) {
    data: revertirRetiroDevolucion(retiroId: $retiroId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const revertirColectaDevolucionMutation = gql`
  mutation ($colectaId: ID!, $usuarioId: ID) {
    data: revertirColectaDevolucion(colectaId: $colectaId, usuarioId: $usuarioId) {
      id
      estado
    }
  }
`;

export const acreditacionPreviewQuery = gql`
  query ($retiroId: ID!) {
    data: acreditacionPreview(retiroId: $retiroId) {
      retiroId
      proveedor { id persona { nombre } }
      montoTotal
      lineas {
        productoId
        productoDescripcion
        cantidadBase
        costoMedio
        total
        presentaciones {
          id
          descripcion
          cantidad
          principal
        }
      }
    }
  }
`;

export const acreditarRetiroMutation = gql`
  mutation (
    $retiroId: ID!
    $nroNotaCredito: String
    $fecha: String
    $items: [NotaCreditoDevolucionItemInput!]!
    $usuarioId: ID
  ) {
    data: acreditarRetiro(
      retiroId: $retiroId
      nroNotaCredito: $nroNotaCredito
      fecha: $fecha
      items: $items
      usuarioId: $usuarioId
    ) {
      id
      nroNotaCredito
      montoTotal
      estado
    }
  }
`;

export const revertirNotaCreditoDevolucionMutation = gql`
  mutation ($id: ID!, $usuarioId: ID) {
    data: revertirNotaCreditoDevolucion(id: $id, usuarioId: $usuarioId)
  }
`;
