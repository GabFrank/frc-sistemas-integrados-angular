import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

/** Guarda la tabla de horarios del usuario entera (#523); los que no vienen se quitan. */
@Injectable({
  providedIn: 'root',
})
export class SaveHorariosUsuarioGQL extends Mutation<Response> {
  document = gql`
    mutation saveHorariosUsuario($usuarioId: Int!, $horarios: [HorarioInput]!) {
      data: saveHorariosUsuario(usuarioId: $usuarioId, horarios: $horarios) {
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
