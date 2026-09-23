import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirSenaCuponMutation } from './graphql-query';

export interface ImprimirSenaCuponResponse {
  data: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImprimirSenaCuponGQL extends Mutation<ImprimirSenaCuponResponse> {
  document = imprimirSenaCuponMutation;
}
