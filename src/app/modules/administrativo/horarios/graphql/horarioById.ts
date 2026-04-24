
import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class HorarioByIdGQL extends Query<Response> {
    document = gql`
    query horario($id: ID!) {
      data: horario(id: $id) {
        id
        descripcion
        horaEntrada
        horaSalida
        toleranciaMinutos
        inicioDescanso
        finDescanso
        creadoEn
      }
    }
  `;
}
