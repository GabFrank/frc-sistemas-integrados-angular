import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { usuariosDestinatariosNotificacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosDestinatariosNotificacionGQL extends Query<any, { notificacionId: number }> {
  document = usuariosDestinatariosNotificacionQuery;
}

