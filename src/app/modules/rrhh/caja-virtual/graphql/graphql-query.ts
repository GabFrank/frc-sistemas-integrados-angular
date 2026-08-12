import gql from "graphql-tag";

export const cajaVirtualesActivasQuery = gql`
  {
    data: cajaVirtualesActivas {
      id
      nombre
      tipo
      saldoGs
      saldoRs
      saldoDs
      activo
    }
  }
`;
