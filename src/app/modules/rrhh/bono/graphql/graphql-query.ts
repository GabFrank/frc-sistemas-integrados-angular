import gql from "graphql-tag";

const FIELDS = `id funcionario { id persona { id nombre } } tipo monto fecha motivo esRecurrente frecuencia anulado`;

export const bonosPorFuncionarioQuery = gql`
  query ($funcionarioId: ID!) { data: bonosPorFuncionario(funcionarioId: $funcionarioId) { ${FIELDS} } }
`;
export const saveBonoMutation = gql`
  mutation saveBono($entity: BonoInput!) { data: saveBono(bono: $entity) { ${FIELDS} } }
`;
export const anularBonoMutation = gql`
  mutation anularBono($id: ID!) { data: anularBono(id: $id) { ${FIELDS} } }
`;
