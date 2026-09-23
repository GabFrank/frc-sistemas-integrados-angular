import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularNotaRemisionMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class AnularNotaRemisionGQL extends Mutation<any> {
  document = anularNotaRemisionMutation;
}
