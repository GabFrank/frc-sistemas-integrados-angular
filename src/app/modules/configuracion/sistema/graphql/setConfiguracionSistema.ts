import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ConfiguracionSistema } from '../sistema.model';
import { setConfiguracionSistemaMutation } from './graphql-query';

export interface Response {
  data: { setConfiguracionSistema: ConfiguracionSistema };
}

@Injectable({ providedIn: 'root' })
export class SetConfiguracionSistemaGQL extends Mutation<Response> {
  document = setConfiguracionSistemaMutation;
}
