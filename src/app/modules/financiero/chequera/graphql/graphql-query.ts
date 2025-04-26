import gql from 'graphql-tag';

export const chequeraQuery = gql`
  query chequeraQuery($id: ID!) {
    data: chequera(id: $id) {
      id
      cuentaBancaria {
        id
      }
      rangoDesde
      rangoHasta
      fechaRetiro
      creadoEn
      usuario {
        id
      }
      cheques {
        id
      }
    }
  }
`;

export const chequerasQuery = gql`
  query chequerasQuery($page: Int, $size: Int) {
    data: chequeras(page: $page, size: $size) {
      id
      cuentaBancaria {
        id
      }
      rangoDesde
      rangoHasta
      fechaRetiro
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const chequerasSearchQuery = gql`
  query chequerasSearchQuery($texto: String) {
    data: chequerasSearch(texto: $texto) {
      id
      cuentaBancaria {
        id
      }
      rangoDesde
      rangoHasta
      fechaRetiro
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const countChequeraQuery = gql`
  query {
    data: countChequera
  }
`;

export const saveChequera = gql`
  mutation saveChequera($entity: ChequeraInput!) {
    data: saveChequera(entity: $entity) {
      id
      cuentaBancaria {
        id
      }
      rangoDesde
      rangoHasta
      fechaRetiro
      creadoEn
      usuario {
        id
      }
      cheques {
        id
      }
    }
  }
`;

export const deleteChequera = gql`
  mutation deleteChequera($id: ID!) {
    data: deleteChequera(id: $id)
  }
`; 