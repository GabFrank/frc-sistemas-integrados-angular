import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { registrarOperacionFinancieraMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RegistrarOperacionFinancieraGQL extends Mutation<Response> {
  document = registrarOperacionFinancieraMutation;
}
