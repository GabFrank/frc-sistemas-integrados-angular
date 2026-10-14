import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { enviarFacturaLegalPorCorreoMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EnviarFacturaLegalPorCorreoGQL extends Mutation<Response> {
  document = enviarFacturaLegalPorCorreoMutation;
}
