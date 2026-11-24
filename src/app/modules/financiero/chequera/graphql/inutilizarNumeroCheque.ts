import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { inutilizarNumeroChequeMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class InutilizarNumeroChequeGQL extends Mutation<Response> {
  document = inutilizarNumeroChequeMutation;
}
