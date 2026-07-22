import gql from "graphql-tag";

const FERIADO_FIELDS = `
  id
  fecha
  descripcion
  esNacional
  recargoPorcentaje
  activo
  creadoEn
  usuario { id nickname }
`;

export const feriadosQuery = gql`
  query ($page: Int, $size: Int) {
    data: feriados(page: $page, size: $size) {
      ${FERIADO_FIELDS}
    }
  }
`;

export const feriadosPorRangoQuery = gql`
  query ($desde: String, $hasta: String) {
    data: feriadosPorRango(desde: $desde, hasta: $hasta) {
      ${FERIADO_FIELDS}
    }
  }
`;

export const feriadosPageQuery = gql`
  query ($page: Int, $size: Int, $desde: String, $hasta: String, $descripcion: String, $activo: Boolean) {
    data: feriadosPage(page: $page, size: $size, desde: $desde, hasta: $hasta, descripcion: $descripcion, activo: $activo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${FERIADO_FIELDS} }
    }
  }
`;

export const saveFeriadoMutation = gql`
  mutation saveFeriado($entity: FeriadoInput!) {
    data: saveFeriado(feriado: $entity) {
      ${FERIADO_FIELDS}
    }
  }
`;

export const deleteFeriadoMutation = gql`
  mutation deleteFeriado($id: ID!) {
    deleteFeriado(id: $id)
  }
`;
