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
