import gql from "graphql-tag";

const HORA_EXTRA_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  fecha
  jornadaId
  sucursalId
  minutos
  tipo
  recargoPorcentaje
  montoCalculado
  origen
  anulada
  autorizadoPor { id nickname }
  observacion
`;

export const horasExtraPorFuncionarioYRangoQuery = gql`
  query ($funcionarioId: ID!, $desde: String, $hasta: String) {
    data: horasExtraPorFuncionarioYRango(funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta) {
      ${HORA_EXTRA_FIELDS}
    }
  }
`;

export const horasExtraPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $desde: String, $hasta: String, $tipo: HoraExtraTipo) {
    data: horasExtraPage(page: $page, size: $size, funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta, tipo: $tipo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${HORA_EXTRA_FIELDS} }
    }
  }
`;

export const saveHoraExtraMutation = gql`
  mutation saveHoraExtra($entity: HoraExtraInput!) {
    data: saveHoraExtra(horaExtra: $entity) {
      ${HORA_EXTRA_FIELDS}
    }
  }
`;

export const anularHoraExtraMutation = gql`
  mutation anularHoraExtra($id: ID!) {
    data: anularHoraExtra(id: $id) {
      ${HORA_EXTRA_FIELDS}
    }
  }
`;
