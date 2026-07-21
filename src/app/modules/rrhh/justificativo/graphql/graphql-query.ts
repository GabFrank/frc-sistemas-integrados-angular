import gql from "graphql-tag";

const TIPO_FIELDS = `
  id
  nombre
  descripcion
  evitaPenalizacion
  descuentaSalario
  requiereDocumento
  generadoPorSistema
  activo
`;

const JUSTIFICATIVO_FIELDS = `
  id
  funcionario { id persona { id nombre } }
  fecha
  tipo { ${TIPO_FIELDS} }
  jornadaId
  sucursalId
  observacion
  registradoPor { id nickname }
`;

export const justificativosPorFuncionarioYRangoQuery = gql`
  query ($funcionarioId: ID!, $desde: String, $hasta: String) {
    data: justificativosPorFuncionarioYRango(funcionarioId: $funcionarioId, desde: $desde, hasta: $hasta) {
      ${JUSTIFICATIVO_FIELDS}
    }
  }
`;

export const saveJustificativoMutation = gql`
  mutation saveJustificativo($entity: JustificativoInput!) {
    data: saveJustificativo(justificativo: $entity) {
      ${JUSTIFICATIVO_FIELDS}
    }
  }
`;

export const deleteJustificativoMutation = gql`
  mutation deleteJustificativo($id: ID!) {
    deleteJustificativo(id: $id)
  }
`;

// ---- catalogo de tipos ----

export const tiposJustificativoQuery = gql`
  {
    data: tiposJustificativo {
      ${TIPO_FIELDS}
    }
  }
`;

export const tiposJustificativoActivosQuery = gql`
  {
    data: tiposJustificativoActivos {
      ${TIPO_FIELDS}
    }
  }
`;

export const saveTipoJustificativoMutation = gql`
  mutation saveTipoJustificativo($entity: TipoJustificativoInput!) {
    data: saveTipoJustificativo(tipoJustificativo: $entity) {
      ${TIPO_FIELDS}
    }
  }
`;

export const deleteTipoJustificativoMutation = gql`
  mutation deleteTipoJustificativo($id: ID!) {
    deleteTipoJustificativo(id: $id)
  }
`;
