import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ajustarCajaVirtualPorConteoMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class AjustarCajaVirtualPorConteoGQL extends Mutation<Response> {
  document = ajustarCajaVirtualPorConteoMutation;
}
