import gql from "graphql-tag";

const FIELDS = `id funcionario { id persona { id nombre } } anio montoCalculado mesesTrabajados estado fechaPago`;

export const aguinaldosPorAnioQuery = gql`
  query ($anio: Int!) { data: aguinaldosPorAnio(anio: $anio) { ${FIELDS} } }
`;
export const calcularAguinaldosAnioMutation = gql`
  mutation calcularAguinaldosAnio($anio: Int!) { data: calcularAguinaldosAnio(anio: $anio) }
`;
export const aprobarAguinaldoMutation = gql`
  mutation aprobarAguinaldo($id: ID!) { data: aprobarAguinaldo(id: $id) { ${FIELDS} } }
`;
