import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { gql } from '@apollo/client/core';

@Injectable({
  providedIn: 'root',
})
export class EliminarNotaRecepcionAgrupadaGQL extends Mutation<any> {
  document = gql`
    mutation eliminarNotaRecepcionAgrupada($grupoId: ID!) {
      data: eliminarNotaRecepcionAgrupada(grupoId: $grupoId) {
        grupo {
          id
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
        }
        notasAfectadas {
          id
          numero
          fecha
          valor
          cantidadItens
          pedido {
            id
          }
        }
        mensaje
        success
      }
    }
  `;
} 