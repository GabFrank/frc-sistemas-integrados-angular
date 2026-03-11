
import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class HorariosGQL extends Query<Response> {
    document = gql`
    query horarios($page: Int, $size: Int) {
      data: horarios(page: $page, size: $size) {
        getContent {
            id
            descripcion
            horaEntrada
            horaSalida
            toleranciaMinutos
            inicioDescanso
            finDescanso
            creadoEn
        }
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
      }
    }
  `;
}
