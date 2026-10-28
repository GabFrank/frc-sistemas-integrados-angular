import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

/** Los horarios que rigen para el funcionario, los mismos que usa la marcación (#523). */
@Injectable({
  providedIn: 'root',
})
export class HorariosPorFuncionarioGQL extends Query<Response> {
  document = gql`
    query horariosPorFuncionario($funcionarioId: Int!) {
      data: horariosPorFuncionario(funcionarioId: $funcionarioId) {
        id
        horaEntrada
        horaSalida
        dias
        turno
      }
    }
  `;
}
