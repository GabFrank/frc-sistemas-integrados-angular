import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { enviarPreGastoATesoreriaMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class EnviarPreGastoATesoreriaGQL extends Mutation<Response> {
  document = enviarPreGastoATesoreriaMutation;
}
