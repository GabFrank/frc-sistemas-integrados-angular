import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { registrarEntradaVariaMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RegistrarEntradaVariaGQL extends Mutation<Response> {
  document = registrarEntradaVariaMutation;
}
