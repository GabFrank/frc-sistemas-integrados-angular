import { Injectable } from '@angular/core';
import { Mutation, gql } from 'apollo-angular';

export interface AsignacionError {
  pedidoItemId: number;
  error: string;
}

export interface AsignacionResult {
  success: boolean;
  message: string;
  notaRecepcionItems: any[];
  errores: AsignacionError[];
}

export interface AsignarItemsANotaResponse {
  data: AsignacionResult;
}

const ASIGNAR_ITEMS_A_NOTA = gql`
  mutation asignarItemsANota($notaRecepcionId: ID!, $pedidoItemIds: [ID!]!, $usuarioId: ID) {
    data: asignarItemsANota(notaRecepcionId: $notaRecepcionId, pedidoItemIds: $pedidoItemIds, usuarioId: $usuarioId) {
      success
      message
      notaRecepcionItems {
        id
        cantidadEnNota
        precioUnitarioEnNota
        estado
        producto {
          id
          descripcion
        }
        pedidoItem {
          id
          cantidadSolicitada
        }
      }
      errores {
        pedidoItemId
        error
      }
    }
  }
`;

// Antes era un apollo.mutate a mano: sin «Guardando…» y el motivo del rechazo lo tenía que mostrar cada pantalla.
// Como Mutation pasa por GenericCrudService.onCustomMutation (#501).
@Injectable({
  providedIn: 'root'
})
export class AsignarItemsANotaGQL extends Mutation<AsignarItemsANotaResponse> {
  document = ASIGNAR_ITEMS_A_NOTA;
}
