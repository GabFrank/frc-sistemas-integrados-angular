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
