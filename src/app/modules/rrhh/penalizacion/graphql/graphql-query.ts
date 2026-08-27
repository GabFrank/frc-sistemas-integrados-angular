import gql from "graphql-tag";

const PENALIZACION_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  jornadaId
  sucursalId
  tipo
  descripcion
  monto
  fecha
  autoGenerada
  anulada
  registradoPor { id nickname }
`;

export const penalizacionesPorFuncionarioYRangoQuery = gql`
  query ($funcionarioId: ID!, $desde: String, $hasta: String) {
    data: penalizacionesPorFuncionarioYRango(funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta) {
      ${PENALIZACION_FIELDS}
    }
  }
`;

export const penalizacionesPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $desde: String, $hasta: String, $tipo: PenalizacionTipo) {
    data: penalizacionesPage(page: $page, size: $size, funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta, tipo: $tipo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${PENALIZACION_FIELDS} }
    }
  }
`;

export const savePenalizacionMutation = gql`
  mutation savePenalizacion($entity: PenalizacionInput!) {
    data: savePenalizacion(penalizacion: $entity) {
      ${PENALIZACION_FIELDS}
    }
  }
`;

export const anularPenalizacionMutation = gql`
  mutation anularPenalizacion($id: ID!) {
    data: anularPenalizacion(id: $id) {
      ${PENALIZACION_FIELDS}
    }
  }
`;

export const contarAdvertenciasQuery = gql`
  query contarAdvertencias($funcionarioId: ID!) {
    data: contarAdvertencias(funcionarioId: $funcionarioId)
  }
`;
export const actaAdvertenciaQuery = gql`
  query imprimirActaAdvertencia($id: ID!) {
    data: imprimirActaAdvertencia(id: $id)
  }
`;
export const generarPenalizacionesAutoRangoMutation = gql`
  mutation generarPenalizacionesAutoRango($desde: String, $hasta: String) {
    data: generarPenalizacionesAutoRango(desde: $desde, hasta: $hasta)
  }
`;
export const generarPenalizacionesAutoMutation = gql`
  mutation generarPenalizacionesAuto($fecha: String) {
    data: generarPenalizacionesAuto(fecha: $fecha)
  }
`;
