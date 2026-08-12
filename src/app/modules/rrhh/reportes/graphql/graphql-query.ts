import gql from "graphql-tag";

export const reporteNominaMesQuery = gql`
  query ($periodo: String!) { data: reporteNominaMes(periodo: $periodo) }
`;
export const reporteResumenIpsQuery = gql`
  query ($periodo: String!) { data: reporteResumenIps(periodo: $periodo) }
`;

export const reporteValesPendientesQuery = gql`
  query { data: reporteValesPendientes }
`;
export const reportePrestamosActivosQuery = gql`
  query { data: reportePrestamosActivos }
`;
export const reporteAguinaldoAnualQuery = gql`
  query ($anio: Int!) { data: reporteAguinaldoAnual(anio: $anio) }
`;

// Recibos firmables por registro (base64). anchoMm: null=PDF A4, 58/80=ticket. escpos=true → payload ESC/POS.
export const imprimirReciboValeQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboVale(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;
export const imprimirReciboPenalizacionQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboPenalizacion(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;
export const imprimirReciboAguinaldoQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboAguinaldo(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;
export const imprimirReciboPrestamoQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboPrestamo(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;
export const imprimirReciboBonoQuery = gql`
  query ($id: ID!, $anchoMm: Int, $escpos: Boolean) { data: imprimirReciboBono(id: $id, anchoMm: $anchoMm, escpos: $escpos) }
`;
