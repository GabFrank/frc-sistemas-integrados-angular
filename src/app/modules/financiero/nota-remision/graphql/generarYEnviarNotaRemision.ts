import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarYEnviarNotaRemisionMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class GenerarYEnviarNotaRemisionGQL extends Mutation<any> {
  document = generarYEnviarNotaRemisionMutation;
}
