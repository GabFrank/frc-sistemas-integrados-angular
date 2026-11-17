import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

/** Todos los horarios que se pueden asignar, sin importar a quién (los horarios se comparten). */
@Injectable({
  providedIn: 'root',
})
export class HorariosCatalogoGQL extends Query<Response> {
  document = gql`
    query horariosCatalogo {
      data: horariosCatalogo {
        id
        descripcion
        horaEntrada
        horaSalida
        dias
        turno
        cantidadAsignados
      }
    }
  `;
}
