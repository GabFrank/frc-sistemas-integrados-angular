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

// ── Dashboard de cheques ──

// Campos de un cheque para la lista del dashboard (todo por fecha de pago).
const chequeDashboardFields = `
  id
  numero
  fechaEntrega
  fechaPago
  fechaCobro
  diferido
  nominal
  total
  beneficiario
  concepto
  estado
  motivoAnulacion
  moneda { id simbolo denominacion }
  cuentaBancaria { id numero banco { id nombre } }
  chequera { id nombre }
  pagoDetalleCuota { id }
`;

export const chequesDashboardQuery = gql`
  query chequesDashboard($desde: String!, $hasta: String!, $cuentaBancariaId: ID, $chequeraId: ID, $estado: EstadoCheque) {
    data: chequesDashboard(desde: $desde, hasta: $hasta, cuentaBancariaId: $cuentaBancariaId, chequeraId: $chequeraId, estado: $estado) {
      ${chequeDashboardFields}
    }
  }
`;

export const chequesResumenPorDiaQuery = gql`
  query chequesResumenPorDia($desde: String!, $hasta: String!, $cuentaBancariaId: ID, $chequeraId: ID, $estado: EstadoCheque) {
    data: chequesResumenPorDia(desde: $desde, hasta: $hasta, cuentaBancariaId: $cuentaBancariaId, chequeraId: $chequeraId, estado: $estado) {
      fecha
      total
      cantidad
    }
  }
`;

export const chequesSaldosPorChequeraQuery = gql`
  query chequesSaldosPorChequera($hasta: String!, $estado: EstadoCheque) {
    data: chequesSaldosPorChequera(hasta: $hasta, estado: $estado) {
      pendienteHastaFecha
      saldoCuenta
      saldoReservado
      hojasDisponibles
      chequera { id nombre siguienteNumero rangoHasta }
      cuentaBancaria { id numero banco { id nombre } moneda { id simbolo } }
    }
  }
`;

export const cobrarChequeMutation = gql`
  mutation cobrarCheque($chequeId: ID!) {
    data: cobrarCheque(chequeId: $chequeId) {
      ${chequeDashboardFields}
    }
  }
`;

export const anularChequeMutation = gql`
  mutation anularCheque($chequeId: ID!, $motivo: String) {
    data: anularCheque(chequeId: $chequeId, motivo: $motivo) {
      ${chequeDashboardFields}
    }
  }
`;

export const emitirChequeMutation = gql`
  mutation emitirCheque($chequeraId: Int!, $total: Float!, $diferido: Boolean!, $monedaId: Int, $cuentaBancariaId: Int, $fechaPago: String, $concepto: String) {
    data: emitirCheque(chequeraId: $chequeraId, total: $total, diferido: $diferido, monedaId: $monedaId, cuentaBancariaId: $cuentaBancariaId, fechaPago: $fechaPago, concepto: $concepto) {
      ${chequeDashboardFields}
    }
  }
`; 