import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ConfiguracionMonedaModulo } from '../configuracion-moneda-modulo.model';
import { configuracionesMonedaModuloQuery } from './graphql-query';

export interface Response {
  data: ConfiguracionMonedaModulo[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionesMonedaModuloGQL extends Query<Response> {
  document = configuracionesMonedaModuloQuery;
}
