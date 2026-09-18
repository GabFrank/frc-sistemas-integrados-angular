import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularNotaCreditoMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class AnularNotaCreditoGQL extends Mutation<any> {
  document = anularNotaCreditoMutation;
}
