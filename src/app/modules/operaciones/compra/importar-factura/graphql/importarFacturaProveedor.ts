import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { importarFacturaProveedorMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImportarFacturaProveedorGQL extends Mutation {
  document = importarFacturaProveedorMutation;
}
