import gql from "graphql-tag";

const configFields = `
  id
  diasEstancada
  diasEstancadaUrgente
  rankingTopN
  dashboardRangoDefault
  ticketAnchoMm
  impresoraTicket
  comprobanteTitulo
  comprobanteTextoFirma
  mermaRespetaMotivo
  tipoGastoMerma
  alertaIncluyeRetirado
  alertaBloqueante
`;

export const devolucionConfiguracionQuery = gql`
  query {
    data: devolucionConfiguracion {
      ${configFields}
    }
  }
`;

export const guardarDevolucionConfiguracionMutation = gql`
  mutation ($input: DevolucionConfiguracionInput!) {
    data: guardarDevolucionConfiguracion(input: $input) {
      ${configFields}
    }
  }
`;
