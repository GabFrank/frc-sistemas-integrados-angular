import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ConfiguracionIa } from '../configuracion-ia.model';
import { configuracionIaQuery } from './graphql-query';

export interface Response {
  data: ConfiguracionIa;
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionIaGQL extends Query<Response> {
  document = configuracionIaQuery;
}
