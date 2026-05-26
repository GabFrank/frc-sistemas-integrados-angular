import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ConfiguracionSistema } from '../sistema.model';
import { configuracionSistemaQuery } from './graphql-query';

export interface Response {
  data: { configuracionSistema: ConfiguracionSistema | null };
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionSistemaGQL extends Query<Response> {
  document = configuracionSistemaQuery;
}
