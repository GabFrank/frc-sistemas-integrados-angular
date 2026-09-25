import gql from "graphql-tag";

const LIQUIDACION_CONCEPTO_FIELDS = `
  id
  codigo
  descripcion
  esHaber
  esCalculadoAuto
  esRemunerativo
  activo
`;

export const liquidacionConceptosQuery = gql`
  query liquidacionConceptos($page: Int, $size: Int) {
    data: liquidacionConceptos(page: $page, size: $size) { ${LIQUIDACION_CONCEPTO_FIELDS} }
  }
`;

export const saveLiquidacionConceptoQuery = gql`
  mutation saveLiquidacionConcepto($entity: LiquidacionConceptoInput!) {
    data: saveLiquidacionConcepto(liquidacionConcepto: $entity) { ${LIQUIDACION_CONCEPTO_FIELDS} }
  }
`;

export const deleteLiquidacionConceptoQuery = gql`
  mutation deleteLiquidacionConcepto($id: ID!) {
    data: deleteLiquidacionConcepto(id: $id)
  }
`;
