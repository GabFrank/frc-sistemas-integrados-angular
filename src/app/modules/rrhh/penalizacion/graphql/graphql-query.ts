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

export const generarPenalizacionesAutoMutation = gql`
  mutation generarPenalizacionesAuto($fecha: String) {
    data: generarPenalizacionesAuto(fecha: $fecha)
  }
`;
