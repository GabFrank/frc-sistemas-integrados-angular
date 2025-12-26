import { gql } from 'apollo-angular';

export const ETAPA_ACTUAL_POR_PEDIDO = gql`
  query etapaActualPorPedido($pedidoId: ID!) {
    etapaActualPorPedido(pedidoId: $pedidoId)
  }
`; 