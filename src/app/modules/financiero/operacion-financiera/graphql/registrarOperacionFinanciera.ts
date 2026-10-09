import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { registrarOperacionFinancieraMutation, registrarOperacionFinancieraSinClaveMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RegistrarOperacionFinancieraGQL extends Mutation<Response> {
  document = registrarOperacionFinancieraMutation;
}

/** Para un central que todavía no conoce `claveIdempotencia`. */
@Injectable({ providedIn: 'root' })
export class RegistrarOperacionFinancieraSinClaveGQL extends Mutation<Response> {
  document = registrarOperacionFinancieraSinClaveMutation;
}
