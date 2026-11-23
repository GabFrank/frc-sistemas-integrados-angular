import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ConfiguracionMonedaModulo } from '../configuracion-moneda-modulo.model';
import { saveConfiguracionMonedaModuloMutation } from './graphql-query';

export interface Response {
  data: ConfiguracionMonedaModulo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveConfiguracionMonedaModuloGQL extends Mutation<Response> {
  document = saveConfiguracionMonedaModuloMutation;
}
