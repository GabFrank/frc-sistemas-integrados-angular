import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { gql } from '@apollo/client/core';

@Injectable({
  providedIn: 'root',
})
export class GetGruposPorPedidoGQL extends Query<any> {
  document = gql`
    query getGruposPorPedido($pedidoId: ID!, $page: Int, $size: Int) {
      data: getGruposPorPedido(pedidoId: $pedidoId, page: $page, size: $size) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          pedido {
            id
          }
          estado
          cantNotas
          valorTotal
          creadoEn
          proveedor {
            id
            persona {
              nombre
            }
          }
          usuario {
            id
            nickname
            persona {
              nombre
            }
          }
          sucursal {
            id
            nombre
          }
          solicitudPago {
            id
            estado
            pago {
              id
              estado
            }
          }
        }
      }
    }
  `;
} 