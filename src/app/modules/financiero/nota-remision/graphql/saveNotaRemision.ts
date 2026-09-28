import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveNotaRemisionMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class SaveNotaRemisionGQL extends Mutation<any> {
  document = saveNotaRemisionMutation;
}
