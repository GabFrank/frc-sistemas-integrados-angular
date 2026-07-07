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
