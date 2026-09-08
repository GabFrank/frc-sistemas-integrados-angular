import gql from "graphql-tag";

const FIELDS = `id funcionario { id persona { id nombre } } tipo monto frecuencia motivo activo creadoEn`;

export const bonosRecurrentesPageQuery = gql`
  query ($page: Int, $size: Int, $funcionarioId: ID, $activo: Boolean) {
    data: bonosRecurrentesPage(page: $page, size: $size, funcionarioId: $funcionarioId, activo: $activo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${FIELDS} }
    }
  }
`;
export const saveBonoRecurrenteMutation = gql`
  mutation saveBonoRecurrente($entity: BonoRecurrenteInput!) {
    data: saveBonoRecurrente(bonoRecurrente: $entity) { ${FIELDS} }
  }
`;
export const cambiarEstadoBonoRecurrenteMutation = gql`
  mutation cambiarEstadoBonoRecurrente($id: ID!, $activo: Boolean!) {
    data: cambiarEstadoBonoRecurrente(id: $id, activo: $activo) { ${FIELDS} }
  }
`;
