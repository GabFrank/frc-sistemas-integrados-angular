import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

/** "Asignar a otros": copia el horario a cada funcionario como horario propio (#523). */
@Injectable({
  providedIn: 'root',
})
export class CopiarHorarioGQL extends Mutation<Response> {
  document = gql`
    mutation copiarHorario($horarioId: ID!, $funcionarioIds: [Int]!) {
      data: copiarHorario(horarioId: $horarioId, funcionarioIds: $funcionarioIds) {
        copiados
        errores
      }
    }
  `;
}
