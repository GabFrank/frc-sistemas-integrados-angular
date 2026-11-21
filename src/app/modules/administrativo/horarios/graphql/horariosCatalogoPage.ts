import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

/** El catálogo de horarios de a una página, paginado en el central (#772). */
@Injectable({
  providedIn: 'root',
})
export class HorariosCatalogoPageGQL extends Query<Response> {
  document = gql`
    query horariosCatalogoPage($page: Int, $size: Int) {
      data: horariosCatalogoPage(page: $page, size: $size) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          descripcion
          horaEntrada
          horaSalida
          dias
          turno
          cantidadAsignados
        }
      }
    }
  `;
}
