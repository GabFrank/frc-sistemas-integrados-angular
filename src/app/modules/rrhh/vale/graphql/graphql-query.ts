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

export const valesPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $estado: ValeEstado, $desde: String, $hasta: String) {
    data: valesPage(page: $page, size: $size, funcionarioId: $funcionarioId, estado: $estado, desde: $desde, hasta: $hasta) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${VALE_FIELDS} }
    }
  }
`;

export const saveValeMutation = gql`
  mutation saveVale($entity: ValeRrhhInput!) {
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

export const crearValeConfirmadoMutation = gql`
  mutation crearValeConfirmado($entity: ValeRrhhInput!, $cajaVirtualId: ID!, $autorizadoPorId: ID) {
    data: crearValeConfirmado(vale: $entity, cajaVirtualId: $cajaVirtualId, autorizadoPorId: $autorizadoPorId) { ${VALE_FIELDS} }
  }
`;
