
import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class HorariosPorUsuarioGQL extends Query<Response> {
    document = gql`
    query horariosPorUsuario($usuarioId: Int) {
      data: horariosPorUsuario(usuarioId: $usuarioId) {
        id
        descripcion
        horaEntrada
        horaSalida
        dias
        turno
      }
    }
  `;
}
