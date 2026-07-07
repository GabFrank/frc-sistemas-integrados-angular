import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { configuracionesRrhhQuery } from './graphql-query';

export interface Response {
  data: ConfiguracionRrhh[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionesRrhhGQL extends Query<Response> {
  document = configuracionesRrhhQuery;
}
