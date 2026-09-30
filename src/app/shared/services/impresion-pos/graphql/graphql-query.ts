import gql from "graphql-tag";

/**
 * Comprobantes del POS generados por la filial para imprimir desde esta PC (ESC/POS en base64).
 * Solo existen en filiales con la impresion desde el cliente: ver docs/impresion-pos-desde-cliente.md.
 */
export const ticketEscposQuery = gql`
  query ticketEscpos($tipo: TicketEscposTipo!, $id: ID!, $reimpresion: Boolean, $local: String) {
    data: ticketEscpos(tipo: $tipo, id: $id, reimpresion: $reimpresion, local: $local)
  }
`;

/**
 * Lo mismo contra el CENTRAL (factura de la lista de facturas, cierre de caja): los registros del
 * central se identifican por id + sucursal.
 */
export const ticketEscposCentralQuery = gql`
  query ticketEscposCentral($tipo: TicketEscposTipo!, $id: ID!, $sucId: ID!, $local: String) {
    data: ticketEscpos(tipo: $tipo, id: $id, sucId: $sucId, local: $local)
  }
`;

export const senaCuponEscposQuery = gql`
  query senaCuponEscpos($input: SenaCuponInput!, $local: String) {
    data: senaCuponEscpos(input: $input, local: $local)
  }
`;
