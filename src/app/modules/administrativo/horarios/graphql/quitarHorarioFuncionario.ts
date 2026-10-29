import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

/** Le quita un horario al funcionario: borra el propio, desvincula el compartido (#523). */
@Injectable({
  providedIn: 'root',
})
export class QuitarHorarioFuncionarioGQL extends Mutation<Response> {
  document = gql`
    mutation quitarHorarioFuncionario($funcionarioId: Int!, $horarioId: ID!) {
      data: quitarHorarioFuncionario(funcionarioId: $funcionarioId, horarioId: $horarioId) {
        id
        horarioResumen
      }
    }
  `;
}
