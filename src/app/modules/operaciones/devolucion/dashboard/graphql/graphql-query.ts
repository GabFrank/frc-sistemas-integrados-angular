import gql from "graphql-tag";

// Todas filtran por rango de fecha (obligatorio) y sucursal opcional.

export const resumenDevolucionesQuery = gql`
  query ($fechaInicio: String!, $fechaFin: String!, $sucursalId: ID) {
    data: resumenDevoluciones(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
    ) {
      total
      conProveedor
      sinProveedor
      pendientesRetiro
      valorTotal
      valorMerma
    }
  }
`;

export const devolucionesPorEstadoResumenQuery = gql`
  query ($fechaInicio: String!, $fechaFin: String!, $sucursalId: ID) {
    data: devolucionesPorEstadoResumen(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
    ) {
      estado
      cantidad
    }
  }
`;

export const topProductosDevueltosQuery = gql`
  query (
    $fechaInicio: String!
    $fechaFin: String!
    $sucursalId: ID
    $limite: Int
  ) {
    data: topProductosDevueltos(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
      limite: $limite
    ) {
      productoId
      descripcion
      cantidad
      valor
    }
  }
`;

export const topMotivosDevolucionQuery = gql`
  query (
    $fechaInicio: String!
    $fechaFin: String!
    $sucursalId: ID
    $limite: Int
  ) {
    data: topMotivosDevolucion(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
      limite: $limite
    ) {
      motivoId
      descripcion
      items
      cantidad
    }
  }
`;

export const devolucionesSeriePorDiaQuery = gql`
  query ($fechaInicio: String!, $fechaFin: String!, $sucursalId: ID) {
    data: devolucionesSeriePorDia(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
    ) {
      fecha
      cantidad
      valor
    }
  }
`;
