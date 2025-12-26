import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { gql } from 'apollo-angular';

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
  mutation asignarItemsANota($notaRecepcionId: ID!, $pedidoItemIds: [ID!]!) {
    data: asignarItemsANota(notaRecepcionId: $notaRecepcionId, pedidoItemIds: $pedidoItemIds) {
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

@Injectable({
  providedIn: 'root'
})
export class AsignarItemsANotaGQL {
  constructor(private apollo: Apollo) {}

  mutate(notaRecepcionId: number, pedidoItemIds: number[]): Observable<AsignacionResult> {
    return this.apollo.mutate<AsignarItemsANotaResponse>({
      mutation: ASIGNAR_ITEMS_A_NOTA,
      variables: {
        notaRecepcionId,
        pedidoItemIds
      }
    }).pipe(
      map(result => result.data!.data)
    );
  }
} 