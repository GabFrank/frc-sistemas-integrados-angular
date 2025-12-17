import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { notificarInicioSesionMutation } from './graphql-query';

export interface NotificarInicioSesionResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificarInicioSesionGQL extends Mutation<NotificarInicioSesionResponse> {
  override document = notificarInicioSesionMutation;
}

