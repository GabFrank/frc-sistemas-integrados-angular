import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveCajaVirtualMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SaveCajaVirtualGQL extends Mutation<Response> {
  document = saveCajaVirtualMutation;
}
