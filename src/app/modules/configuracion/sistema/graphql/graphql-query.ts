import gql from 'graphql-tag';

export const configuracionSistemaQuery = gql`
  query configuracionSistema($clave: String!) {
    configuracionSistema(clave: $clave) {
      clave
      valor
      descripcion
      encriptado
      modificadoEn
    }
  }
`;

export const setConfiguracionSistemaMutation = gql`
  mutation setConfiguracionSistema($clave: String!, $valor: String) {
    setConfiguracionSistema(clave: $clave, valor: $valor) {
      clave
      valor
      encriptado
      modificadoEn
    }
  }
`;

export const testOpenAiConnectionMutation = gql`
  mutation testOpenAiConnection {
    testOpenAiConnection
  }
`;
