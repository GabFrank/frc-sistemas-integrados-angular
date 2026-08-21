import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ajustarSaldoCuentaBancariaMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AjustarSaldoCuentaBancariaGQL extends Mutation<Response> {
  document = ajustarSaldoCuentaBancariaMutation;
}
