import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { configuracionesRrhhSearchQuery } from './graphql-query';

export interface Response {
  data: ConfiguracionRrhh[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionesRrhhSearchGQL extends Query<Response> {
  document = configuracionesRrhhSearchQuery;
}
