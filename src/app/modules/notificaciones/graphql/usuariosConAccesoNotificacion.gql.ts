import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { usuariosConAccesoNotificacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosConAccesoNotificacionGQL extends Query<any, { notificacionId: number }> {
  document = usuariosConAccesoNotificacionQuery;
}

