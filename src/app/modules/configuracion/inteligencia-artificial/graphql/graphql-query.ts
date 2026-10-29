import gql from "graphql-tag";

const camposConfiguracionIa = `
  proveedor
  claveCargada
  claveFinal
  modelo
  claudeClaveCargada
  claudeClaveFinal
  claudeModelo
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
  mutation (
    $apiKey: String
    $modelo: String
    $promptAdicional: String
    $proveedor: String
    $claudeApiKey: String
    $claudeModelo: String
  ) {
    data: guardarConfiguracionIa(
      apiKey: $apiKey
      modelo: $modelo
      promptAdicional: $promptAdicional
      proveedor: $proveedor
      claudeApiKey: $claudeApiKey
      claudeModelo: $claudeModelo
    ) {
      ${camposConfiguracionIa}
    }
  }
`;

export const probarConexionIaMutation = gql`
  mutation ($proveedor: String) {
    data: probarConexionIa(proveedor: $proveedor)
  }
`;
