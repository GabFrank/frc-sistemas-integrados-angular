import gql from "graphql-tag";

export const reporteNominaMesQuery = gql`
  query ($periodo: String!) { data: reporteNominaMes(periodo: $periodo) }
`;
export const reporteResumenIpsQuery = gql`
  query ($periodo: String!) { data: reporteResumenIps(periodo: $periodo) }
`;
