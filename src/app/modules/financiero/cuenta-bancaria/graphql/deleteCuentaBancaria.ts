import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteCuentaBancariaMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class DeleteCuentaBancariaGQL extends Mutation<Response> {
  document = deleteCuentaBancariaMutation;
}
