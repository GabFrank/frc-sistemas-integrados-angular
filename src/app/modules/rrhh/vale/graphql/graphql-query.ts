import gql from "graphql-tag";

const VALE_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  motivo { id nombre }
  monto
  moneda { id denominacion }
  fecha
  estado
  esAdelanto
  cajaVirtualId
  observacion
  autorizadoPor { id nickname }
`;

export const valesPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) {
    data: valesPorFuncionario(funcionarioId: $funcionarioId) { ${VALE_FIELDS} }
  }
`;

export const valesPorEstadoQuery = gql`
  query ($estado: ValeEstado) {
    data: valesPorEstado(estado: $estado) { ${VALE_FIELDS} }
  }
`;

export const saveValeMutation = gql`
  mutation saveVale($entity: ValeInput!) {
    data: saveVale(vale: $entity) { ${VALE_FIELDS} }
  }
`;

export const confirmarValeMutation = gql`
  mutation confirmarVale($id: ID!, $cajaVirtualId: ID!, $autorizadoPorId: ID) {
    data: confirmarVale(id: $id, cajaVirtualId: $cajaVirtualId, autorizadoPorId: $autorizadoPorId) { ${VALE_FIELDS} }
  }
`;

export const anularValeMutation = gql`
  mutation anularVale($id: ID!) {
    data: anularVale(id: $id) { ${VALE_FIELDS} }
  }
`;
