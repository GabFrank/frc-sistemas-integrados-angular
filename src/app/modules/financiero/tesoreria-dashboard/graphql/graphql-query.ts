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

/**
 * El disponible (saldo − reservado por cheques) va aparte del consolidado: un central anterior a #601 no tiene
 * estos campos y pedirlos en la misma consulta dejaría sin saldos al dashboard.
 */
export const saldoDisponibleTesoreriaQuery = gql`
  query {
    data: saldoConsolidadoTesoreria {
      monedaId
      bancoDisponible
      totalDisponible
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
