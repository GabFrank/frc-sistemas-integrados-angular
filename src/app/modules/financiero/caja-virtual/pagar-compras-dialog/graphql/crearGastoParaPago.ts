import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearGastoParaPagoMutation, crearGastoParaPagoSinClaveMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearGastoParaPagoGQL extends Mutation<Response> {
  document = crearGastoParaPagoMutation;
}

/** Para un central que todavía no conoce `claveIdempotencia`. */
@Injectable({ providedIn: 'root' })
export class CrearGastoParaPagoSinClaveGQL extends Mutation<Response> {
  document = crearGastoParaPagoSinClaveMutation;
}
