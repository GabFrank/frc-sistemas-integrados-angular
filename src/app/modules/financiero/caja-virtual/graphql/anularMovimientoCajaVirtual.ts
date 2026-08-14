import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularMovimientoCajaVirtualMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class AnularMovimientoCajaVirtualGQL extends Mutation<Response> {
  document = anularMovimientoCajaVirtualMutation;
}
