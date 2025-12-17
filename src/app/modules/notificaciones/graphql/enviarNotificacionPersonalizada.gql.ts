import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { enviarNotificacionPersonalizadaMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class EnviarNotificacionPersonalizadaGQL extends Mutation {
  document = enviarNotificacionPersonalizadaMutation;
}

