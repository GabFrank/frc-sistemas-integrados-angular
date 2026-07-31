import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveCuentaBancariaMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SaveCuentaBancariaGQL extends Mutation<Response> {
  document = saveCuentaBancariaMutation;
}
