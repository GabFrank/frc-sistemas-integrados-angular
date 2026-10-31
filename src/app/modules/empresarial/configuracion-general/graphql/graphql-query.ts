import gql from 'graphql-tag';

export const configuracionGeneralQuery = gql`
  query {
    data: configuracionGeneral {
      id
      nombreEmpresa
      razonSocial
      ruc
    }
  }
`;
