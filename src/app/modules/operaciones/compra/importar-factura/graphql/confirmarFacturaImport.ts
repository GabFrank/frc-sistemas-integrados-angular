import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { confirmarFacturaImportMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ConfirmarFacturaImportGQL extends Mutation {
  document = confirmarFacturaImportMutation;
}
