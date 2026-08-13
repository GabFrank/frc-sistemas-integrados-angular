import gql from "graphql-tag";

const FIELDS = `id funcionario { id persona { id nombre } } anio montoCalculado mesesTrabajados montoProyectado mesesProyectados estado fechaPago`;

export const aguinaldosPorAnioQuery = gql`
  query ($anio: Int!) { data: aguinaldosPorAnio(anio: $anio) { ${FIELDS} } }
`;
export const aguinaldosPageQuery = gql`
  query ($page: Int, $size: Int, $anio: Int, $funcionarioId: ID) {
    data: aguinaldosPage(page: $page, size: $size, anio: $anio, funcionarioId: $funcionarioId) {
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
export const calcularAguinaldosAnioMutation = gql`
  mutation calcularAguinaldosAnio($anio: Int!) { data: calcularAguinaldosAnio(anio: $anio) }
`;
export const aprobarAguinaldoMutation = gql`
  mutation aprobarAguinaldo($id: ID!) { data: aprobarAguinaldo(id: $id) { ${FIELDS} } }
`;
export const pagarAguinaldoMutation = gql`
  mutation pagarAguinaldo($id: ID!, $cajaVirtualId: ID!) {
    data: pagarAguinaldo(id: $id, cajaVirtualId: $cajaVirtualId) { ${FIELDS} }
  }
`;
