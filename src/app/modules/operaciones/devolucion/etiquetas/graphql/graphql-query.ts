import gql from "graphql-tag";

export const etiquetasSeparadoPdfQuery = gql`
  query ($devolucionId: ID!) {
    data: etiquetasSeparadoPdf(devolucionId: $devolucionId)
  }
`;

export const imprimirEtiquetasSeparadoMutation = gql`
  mutation ($devolucionId: ID!, $printerName: String, $anchoMm: Int) {
    data: imprimirEtiquetasSeparado(
      devolucionId: $devolucionId
      printerName: $printerName
      anchoMm: $anchoMm
    )
  }
`;
