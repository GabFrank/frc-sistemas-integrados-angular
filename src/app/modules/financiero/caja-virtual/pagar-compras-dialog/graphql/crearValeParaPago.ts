import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearValeParaPagoMutation, crearValeParaPagoSinClaveMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearValeParaPagoGQL extends Mutation<Response> {
  document = crearValeParaPagoMutation;
}

/** Para un central que todavía no conoce `claveIdempotencia`. */
@Injectable({ providedIn: 'root' })
export class CrearValeParaPagoSinClaveGQL extends Mutation<Response> {
  document = crearValeParaPagoSinClaveMutation;
}
