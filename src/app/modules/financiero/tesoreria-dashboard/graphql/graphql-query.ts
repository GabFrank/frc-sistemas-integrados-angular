import gql from 'graphql-tag';

export const saldoConsolidadoTesoreriaQuery = gql`
  query {
    data: saldoConsolidadoTesoreria {
      monedaId
      moneda
      efectivo
      banco
      bancoReservado
      total
    }
  }
`;

export const proximosVencimientosTesoreriaQuery = gql`
  query ($dias: Int) {
    data: proximosVencimientosTesoreria(dias: $dias) {
      tipo
      referenciaId
      descripcion
      monto
      fecha
      diasRestantes
    }
  }
`;

export const agingCppTesoreriaQuery = gql`
  query {
    data: agingCppTesoreria {
      porVencer
      vencido
    }
  }
`;
