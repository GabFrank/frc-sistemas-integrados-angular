import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { seedDteMockMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class SeedDteMockGQL extends Mutation<{ data: boolean }> {
  document = seedDteMockMutation;
}
