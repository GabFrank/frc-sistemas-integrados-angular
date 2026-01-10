import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class GastosPorCategoriaGQL extends Query<any> {
    override document = gql`
    query gastosPorCategoria($inicio: String, $fin: String, $sucId: ID) {
      data: gastosPorCategoria(inicio: $inicio, fin: $fin, sucId: $sucId) {
        categoria
        total
        cantidad
      }
    }
  `;
}
