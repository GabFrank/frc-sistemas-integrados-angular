import gql from "graphql-tag";

const KPIS = `
  periodo funcionariosActivos nominaDelMes liquidacionesPendientes
  valesPendientesCantidad valesPendientesMonto
  prestamosActivosCantidad prestamosActivosSaldo
  penalizacionesMesCantidad penalizacionesMesMonto
  horasExtraMesCantidad horasExtraMesMonto
  cuotasVencidasCantidad aguinaldoEstimadoAnio
  cumpleanosDelMes vacacionesPorVencer
`;

export const dashboardRrhhKpisQuery = gql`
  query ($periodo: String!) { data: dashboardRrhhKpis(periodo: $periodo) { ${KPIS} } }
`;
