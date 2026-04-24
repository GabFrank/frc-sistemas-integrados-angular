import gql from 'graphql-tag';

export const chequeQuery = gql`
  query chequeQuery($id: ID!) {
    data: cheque(id: $id) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const chequesQuery = gql`
  query chequesQuery($page: Int, $size: Int) {
    data: cheques(page: $page, size: $size) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const chequesSearchQuery = gql`
  query chequesSearchQuery($texto: String) {
    data: chequesSearch(texto: $texto) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const chequesPorChequeraIdQuery = gql`
  query chequesPorChequeraIdQuery($chequeraId: ID!) {
    data: chequesPorChequeraId(chequeraId: $chequeraId) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const chequePorPagoDetalleCuotaIdQuery = gql`
  query chequePorPagoDetalleCuotaIdQuery($pagoDetalleCuotaId: ID!) {
    data: chequePorPagoDetalleCuotaId(pagoDetalleCuotaId: $pagoDetalleCuotaId) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const countChequeQuery = gql`
  query {
    data: countCheque
  }
`;

export const saveCheque = gql`
  mutation saveCheque($entity: ChequeInput!) {
    data: saveCheque(entity: $entity) {
      id
      chequera {
        id
      }
      pagoDetalleCuota {
        id
      }
      numero
      fechaEntrega
      fechaPago
      orden
      concepto
      diferido
      total
      firmante {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const deleteCheque = gql`
  mutation deleteCheque($id: ID!) {
    data: deleteCheque(id: $id)
  }
`; 