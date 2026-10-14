import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { egresarMaletinCajaMayorMutation, egresarMaletinCajaMayorSinClaveMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EgresarMaletinCajaMayorGQL extends Mutation<Response> {
  document = egresarMaletinCajaMayorMutation;
}

/** Para un central que todavía no conoce `claveIdempotencia`. */
@Injectable({ providedIn: 'root' })
export class EgresarMaletinCajaMayorSinClaveGQL extends Mutation<Response> {
  document = egresarMaletinCajaMayorSinClaveMutation;
}
