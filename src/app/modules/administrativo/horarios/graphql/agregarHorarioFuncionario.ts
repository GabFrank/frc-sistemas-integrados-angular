import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

/** Crea un horario y se lo deja asignado al funcionario (#523). */
@Injectable({
  providedIn: 'root',
})
export class AgregarHorarioFuncionarioGQL extends Mutation<Response> {
  document = gql`
    mutation agregarHorarioFuncionario($funcionarioId: Int!, $horario: HorarioInput!) {
      data: agregarHorarioFuncionario(funcionarioId: $funcionarioId, horario: $horario) {
        id
        horarioResumen
      }
    }
  `;
}
