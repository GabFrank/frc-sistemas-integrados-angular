import gql from "graphql-tag";

const VAC_FIELDS = `id funcionario { id persona { id nombre } } anioServicio diasGenerados diasGozados fechaCorte prescrita observacion`;
const PER_FIELDS = `id fechaDesde fechaHasta diasUsados estado novedadesGeneradas observacion`;
const VENTA_FIELDS = `id dias monto fecha estado observacion`;

export const vacacionesPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) { data: vacacionesPorFuncionario(funcionarioId: $funcionarioId) { ${VAC_FIELDS} } }
`;
export const vacacionesPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $anio: Int) {
    data: vacacionesPage(page: $page, size: $size, funcionarioId: $funcionarioId, anio: $anio) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${VAC_FIELDS} }
    }
  }
`;
export const vacacionPeriodosQuery = gql`
  query ($vacacionId: ID!) { data: vacacionPeriodos(vacacionId: $vacacionId) { ${PER_FIELDS} } }
`;
export const vacacionVentasQuery = gql`
  query ($vacacionId: ID!) { data: vacacionVentas(vacacionId: $vacacionId) { ${VENTA_FIELDS} } }
`;
export const devengarVacacionMutation = gql`
  mutation devengarVacacion($funcionarioId: ID!) { data: devengarVacacion(funcionarioId: $funcionarioId) { ${VAC_FIELDS} } }
`;
export const programarPeriodoMutation = gql`
  mutation programarPeriodoVacacion($vacacionId: ID!, $desde: String, $hasta: String, $estado: VacacionPeriodoEstado, $observacion: String) {
    data: programarPeriodoVacacion(vacacionId: $vacacionId, desde: $desde, hasta: $hasta, estado: $estado, observacion: $observacion) { ${PER_FIELDS} }
  }
`;
export const aprobarPeriodoMutation = gql`
  mutation aprobarPeriodoVacacion($periodoId: ID!, $autorizadoPorId: ID) {
    data: aprobarPeriodoVacacion(periodoId: $periodoId, autorizadoPorId: $autorizadoPorId) { ${PER_FIELDS} }
  }
`;
export const marcarGozadaMutation = gql`
  mutation marcarGozadaVacacion($periodoId: ID!) { data: marcarGozadaVacacion(periodoId: $periodoId) { ${PER_FIELDS} } }
`;
export const venderDiasMutation = gql`
  mutation venderDiasVacacion($vacacionId: ID!, $dias: Int!, $observacion: String) {
    data: venderDiasVacacion(vacacionId: $vacacionId, dias: $dias, observacion: $observacion) { ${VENTA_FIELDS} }
  }
`;
