import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reenviarNotaCreditoMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ReenviarNotaCreditoGQL extends Mutation<any> {
  document = reenviarNotaCreditoMutation;
}
