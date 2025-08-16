import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { wipeDteDataMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class WipeDteDataGQL extends Mutation<{ data: boolean }> {
  document = wipeDteDataMutation;
}
