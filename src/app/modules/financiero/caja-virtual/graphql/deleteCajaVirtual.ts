import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteCajaVirtualMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class DeleteCajaVirtualGQL extends Mutation<Response> {
  document = deleteCajaVirtualMutation;
}
