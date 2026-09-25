import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarYEnviarNotaCreditoMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class GenerarYEnviarNotaCreditoGQL extends Mutation<any> {
  document = generarYEnviarNotaCreditoMutation;
}
