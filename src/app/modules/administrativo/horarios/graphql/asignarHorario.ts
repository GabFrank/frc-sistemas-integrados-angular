import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

/** "Asignar a otros": les asigna el mismo horario a los funcionarios, sin copiarlo. */
@Injectable({
  providedIn: 'root',
})
export class AsignarHorarioGQL extends Mutation<Response> {
  document = gql`
    mutation asignarHorario($horarioId: ID!, $funcionarioIds: [Int]!) {
      data: asignarHorario(horarioId: $horarioId, funcionarioIds: $funcionarioIds) {
        copiados
        errores
      }
    }
  `;
}
