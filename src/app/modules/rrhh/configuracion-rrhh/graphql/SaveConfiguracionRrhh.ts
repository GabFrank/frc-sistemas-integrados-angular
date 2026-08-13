import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { saveConfiguracionRrhhMutation } from './graphql-query';

export interface Response {
  data: ConfiguracionRrhh;
}

@Injectable({
  providedIn: 'root',
})
export class SaveConfiguracionRrhhGQL extends Mutation<Response> {
  document = saveConfiguracionRrhhMutation;
}
