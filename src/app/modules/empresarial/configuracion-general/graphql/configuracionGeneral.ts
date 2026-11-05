import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionGeneralQuery } from './graphql-query';

export interface ConfiguracionGeneral {
  id: number;
  nombreEmpresa: string;
  razonSocial: string;
  ruc: string;
}

export interface Response {
  data: ConfiguracionGeneral;
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionGeneralGQL extends Query<Response> {
  document = configuracionGeneralQuery;
}
