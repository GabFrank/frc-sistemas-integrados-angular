import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { registrarEntradaVariaMutation, registrarEntradaVariaSinClaveMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RegistrarEntradaVariaGQL extends Mutation<Response> {
  document = registrarEntradaVariaMutation;
}

/** Para un central que todavía no conoce `claveIdempotencia`. */
@Injectable({ providedIn: 'root' })
export class RegistrarEntradaVariaSinClaveGQL extends Mutation<Response> {
  document = registrarEntradaVariaSinClaveMutation;
}
