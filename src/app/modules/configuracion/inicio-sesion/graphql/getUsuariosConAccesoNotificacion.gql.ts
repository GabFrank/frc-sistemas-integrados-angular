import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getUsuariosConAccesoNotificacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetUsuariosConAccesoNotificacionGQL extends Query<any, { notificacionId: number }> {
  document = getUsuariosConAccesoNotificacionQuery;
}

