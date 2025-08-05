import { gql } from 'apollo-angular';

export const RECHAZAR_ITEM = gql`
  mutation rechazarItem($notaRecepcionItemId: ID!, $presentacionId: ID, $rechazos: [RechazoInput!]!, $usuarioId: ID!) {
    data: rechazarItem(notaRecepcionItemId: $notaRecepcionItemId, presentacionId: $presentacionId, rechazos: $rechazos, usuarioId: $usuarioId)
  }
`; 