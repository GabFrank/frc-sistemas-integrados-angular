import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getUsuariosDestinatariosNotificacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetUsuariosDestinatariosNotificacionGQL extends Query<any, { notificacionId: number }> {
  document = getUsuariosDestinatariosNotificacionQuery;
}

