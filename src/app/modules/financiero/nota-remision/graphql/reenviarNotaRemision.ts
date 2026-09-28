import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reenviarNotaRemisionMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ReenviarNotaRemisionGQL extends Mutation<any> {
  document = reenviarNotaRemisionMutation;
}
