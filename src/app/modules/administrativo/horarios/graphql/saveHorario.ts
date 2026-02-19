
import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class SaveHorarioGQL extends Mutation<Response> {
  document = gql`
    mutation saveHorario($entity: HorarioInput!) {
      data: saveHorario(horario: $entity) {
        id
        descripcion
        horaEntrada
        horaSalida
        toleranciaMinutos
        inicioDescanso
        finDescanso
        creadoEn
        dias
        turno
      }
    }
  `;
}
