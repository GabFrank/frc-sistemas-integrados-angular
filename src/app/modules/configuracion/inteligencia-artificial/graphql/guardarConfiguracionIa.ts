import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ConfiguracionIa } from '../configuracion-ia.model';
import { guardarConfiguracionIaMutation } from './graphql-query';

export interface Response {
  data: ConfiguracionIa;
}

@Injectable({
  providedIn: 'root',
})
export class GuardarConfiguracionIaGQL extends Mutation<Response> {
  document = guardarConfiguracionIaMutation;
}
