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

export const devolucionesSeriePorMesQuery = gql`
  query ($fechaInicio: String!, $fechaFin: String!, $sucursalId: ID) {
    data: devolucionesSeriePorMes(
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

export const devolucionesEstancadasQuery = gql`
  query ($diasMinimos: Int, $sucursalId: ID, $limite: Int) {
    data: devolucionesEstancadas(
      diasMinimos: $diasMinimos
      sucursalId: $sucursalId
      limite: $limite
    ) {
      devolucionId
      identificador
      producto
      sucursal
      estado
      fecha
      dias
    }
  }
`;
