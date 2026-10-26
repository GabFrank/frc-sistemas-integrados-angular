import gql from "graphql-tag";

const camposConfiguracionIa = `
  claveCargada
  claveFinal
  modelo
  promptAdicional
  cifradoDisponible
`;

export const configuracionIaQuery = gql`
  query {
    data: configuracionIa {
      ${camposConfiguracionIa}
    }
  }
`;

export const guardarConfiguracionIaMutation = gql`
  mutation ($apiKey: String, $modelo: String, $promptAdicional: String) {
    data: guardarConfiguracionIa(apiKey: $apiKey, modelo: $modelo, promptAdicional: $promptAdicional) {
      ${camposConfiguracionIa}
    }
  }
`;

export const probarConexionIaMutation = gql`
  mutation {
    data: probarConexionIa
  }
`;
