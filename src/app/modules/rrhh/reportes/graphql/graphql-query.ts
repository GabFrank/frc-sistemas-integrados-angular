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
