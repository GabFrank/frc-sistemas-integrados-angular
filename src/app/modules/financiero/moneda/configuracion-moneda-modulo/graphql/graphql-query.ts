import gql from "graphql-tag";

const CONFIGURACION_MONEDA_MODULO_CAMPOS = `
  id
  modulo
  sucursal {
    id
    nombre
  }
  moneda {
    id
    denominacion
    simbolo
  }
  vigenteDesde
  activo
  usuarioNickname
  creadoEn
`;

export const configuracionesMonedaModuloQuery = gql`
  query ($modulo: ModuloMoneda) {
    data: configuracionesMonedaModulo(modulo: $modulo) {
      ${CONFIGURACION_MONEDA_MODULO_CAMPOS}
    }
  }
`;

export const saveConfiguracionMonedaModuloMutation = gql`
  mutation ($input: ConfiguracionMonedaModuloInput!) {
    data: saveConfiguracionMonedaModulo(input: $input) {
      ${CONFIGURACION_MONEDA_MODULO_CAMPOS}
    }
  }
`;

export const setActivoConfiguracionMonedaModuloMutation = gql`
  mutation ($id: ID!, $activo: Boolean!) {
    data: setActivoConfiguracionMonedaModulo(id: $id, activo: $activo) {
      ${CONFIGURACION_MONEDA_MODULO_CAMPOS}
    }
  }
`;
