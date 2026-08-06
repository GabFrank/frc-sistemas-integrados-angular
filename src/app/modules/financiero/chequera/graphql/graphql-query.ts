import gql from 'graphql-tag';

// Campos completos de una chequera (para gestión y selects del dashboard de cheques).
const chequeraFields = `
  id
  nombre
  rangoDesde
  rangoHasta
  siguienteNumero
  estado
  hojasDisponibles
  fechaRetiro
  creadoEn
  cuentaBancaria {
    id
    numero
    banco { id nombre }
    moneda { id simbolo denominacion }
  }
  usuario { id }
`;

export const chequeraQuery = gql`
  query chequeraQuery($id: ID!) {
    data: chequera(id: $id) {
      ${chequeraFields}
    }
  }
`;

export const chequerasQuery = gql`
  query chequerasQuery($page: Int, $size: Int) {
    data: chequeras(page: $page, size: $size) {
      ${chequeraFields}
    }
  }
`;

export const chequerasSearchQuery = gql`
  query chequerasSearchQuery($texto: String) {
    data: chequerasSearch(texto: $texto) {
      ${chequeraFields}
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