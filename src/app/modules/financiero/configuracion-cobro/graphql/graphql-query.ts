import gql from 'graphql-tag';

/** La del diálogo de administración, contra el central (pide rol de tesorería). */
export const configuracionCobroQuery = gql`
  {
    data: configuracionCobro {
      id
      aumentoConTope
      aumentoTopePorcentaje
      usuarioNickname
      modificadoEn
    }
  }
`;

/**
 * La del cobro, contra el filial, APARTE a propósito: solo los dos campos que el filial expone. Un
 * campo nuevo del diálogo no puede romper el cobro (graphql-java valida la selección entera).
 */
export const configuracionCobroPdvQuery = gql`
  {
    data: configuracionCobro {
      aumentoConTope
      aumentoTopePorcentaje
    }
  }
`;

export const saveConfiguracionCobro = gql`
  mutation saveConfiguracionCobro($entity: ConfiguracionCobroInput!) {
    data: saveConfiguracionCobro(input: $entity) {
      id
      aumentoConTope
      aumentoTopePorcentaje
      usuarioNickname
      modificadoEn
    }
  }
`;
