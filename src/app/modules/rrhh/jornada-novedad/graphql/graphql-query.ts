import gql from "graphql-tag";

const NOVEDAD_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  fecha
  tipo
  jornadaId
  sucursalId
  observacion
  registradoPor { id nickname }
`;

export const novedadesPorFuncionarioYRangoQuery = gql`
  query ($funcionarioId: ID!, $desde: String, $hasta: String) {
    data: jornadaNovedadesPorFuncionarioYRango(funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta) {
      ${NOVEDAD_FIELDS}
    }
  }
`;

export const saveNovedadMutation = gql`
  mutation saveJornadaNovedad($entity: JornadaNovedadInput!) {
    data: saveJornadaNovedad(jornadaNovedad: $entity) {
      ${NOVEDAD_FIELDS}
    }
  }
`;

export const deleteNovedadMutation = gql`
  mutation deleteJornadaNovedad($id: ID!) {
    deleteJornadaNovedad(id: $id)
  }
`;
