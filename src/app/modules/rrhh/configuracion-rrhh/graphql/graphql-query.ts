import gql from "graphql-tag";

const CONFIGURACION_RRHH_FIELDS = `
  id
  clave
  valor
  tipo
  descripcion
  activo
  creadoEn
  usuario {
    id
    nickname
  }
`;

export const configuracionesRrhhQuery = gql`
  query ($page: Int, $size: Int) {
    data: configuracionesRrhh(page: $page, size: $size) {
      ${CONFIGURACION_RRHH_FIELDS}
    }
  }
`;

export const configuracionesRrhhSearchQuery = gql`
  query ($texto: String) {
    data: configuracionesRrhhSearch(texto: $texto) {
      ${CONFIGURACION_RRHH_FIELDS}
    }
  }
`;

export const configuracionesRrhhPageQuery = gql`
  query ($page: Int, $size: Int, $texto: String, $tipo: ConfiguracionRrhhTipo) {
    data: configuracionesRrhhPage(page: $page, size: $size, texto: $texto, tipo: $tipo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${CONFIGURACION_RRHH_FIELDS} }
    }
  }
`;

export const saveConfiguracionRrhhMutation = gql`
  mutation saveConfiguracionRrhh($entity: ConfiguracionRrhhInput!) {
    data: saveConfiguracionRrhh(configuracionRrhh: $entity) {
      ${CONFIGURACION_RRHH_FIELDS}
    }
  }
`;

export const deleteConfiguracionRrhhMutation = gql`
  mutation deleteConfiguracionRrhh($id: ID!) {
    deleteConfiguracionRrhh(id: $id)
  }
`;

// ---- TODO-8: impacto de un cambio de configuracion sobre datos ya materializados ----

export const funcionariosBajoSalarioMinimoQuery = gql`
  query ($minimo: Float!) {
    data: funcionariosBajoSalarioMinimo(minimo: $minimo) {
      id
      sueldo
      persona { id nombre }
      cargo { id nombre }
      moneda { id denominacion }
    }
  }
`;

export const ajustarSalariosAlMinimoMutation = gql`
  mutation ($funcionarioIds: [Int], $minimo: Float!, $usuarioId: ID) {
    data: ajustarSalariosAlMinimo(funcionarioIds: $funcionarioIds, minimo: $minimo, usuarioId: $usuarioId)
  }
`;

export const configuracionRrhhHistoricoQuery = gql`
  query ($clave: String!) {
    data: configuracionRrhhHistorico(clave: $clave) {
      id
      clave
      valorAnterior
      valorNuevo
      creadoEn
      usuario { id nickname }
    }
  }
`;
