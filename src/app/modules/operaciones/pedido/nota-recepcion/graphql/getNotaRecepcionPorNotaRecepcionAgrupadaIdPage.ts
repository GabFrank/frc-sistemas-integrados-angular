import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorNotaRecepcionAgrupadaIdPageGQL extends Query<any> {
  document = gql`
    query notaRecepcionPorNotaRecepcionAgrupadaIdPage($id: ID!, $page: Int, $size: Int) {
      data: notaRecepcionPorNotaRecepcionAgrupadaIdPage(id: $id, page: $page, size: $size) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          numero
          fecha
          valor
          descuento
          cantidadItens
          cantidadItensVerificadoRecepcionMercaderia
          cantidadItensNecesitanDistribucion
          pagado
          tipoBoleta
          timbrado
          creadoEn
          usuario {
            id
            nickname
            persona {
              id
              nombre
            }
          }
          pedido {
            id
            estado
            proveedor {
              id
              persona {
                id
                nombre
              }
            }
          }
          notaRecepcionAgrupada {
            id
            estado
          }
          compra {
            id
          }
          documento {
            id
          }
        }
      }
    }
  `;
}