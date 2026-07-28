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

// Serie de nómina por mes (chart de tendencia, últimos 12 meses).
export const nominaSeriePorMesQuery = gql`
  query ($periodoInicio: String!, $periodoFin: String!) {
    data: nominaSeriePorMes(periodoInicio: $periodoInicio, periodoFin: $periodoFin) {
      periodo
      cantidad
      monto
    }
  }
`;

// Top exposición financiera por funcionario (vales + saldo préstamo).
export const rrhhTopExposicionQuery = gql`
  query ($limite: Int) {
    data: rrhhTopExposicion(limite: $limite) {
      funcionarioId
      nombre
      principal
      secundario
    }
  }
`;

// Top horas extra del mes por funcionario.
export const rrhhTopHorasExtraQuery = gql`
  query ($periodo: String!, $limite: Int) {
    data: rrhhTopHorasExtra(periodo: $periodo, limite: $limite) {
      funcionarioId
      nombre
      principal
      secundario
    }
  }
`;

// Cumpleaños de funcionarios activos en el mes del período.
export const rrhhCumpleanosDelMesQuery = gql`
  query ($periodo: String!) {
    data: rrhhCumpleanosDelMes(periodo: $periodo) {
      funcionarioId
      nombre
      dia
      cargo
    }
  }
`;

// Funcionarios con legajo incompleto (peores primero), paginado.
export const rrhhFuncionariosIncompletosQuery = gql`
  query ($page: Int, $size: Int) {
    data: rrhhFuncionariosIncompletos(page: $page, size: $size) {
      total
      items {
        funcionarioId
        nombre
        cargo
        score
        faltantes
      }
    }
  }
`;
