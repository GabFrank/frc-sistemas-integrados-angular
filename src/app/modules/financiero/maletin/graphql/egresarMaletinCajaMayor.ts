import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { egresarMaletinCajaMayorMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EgresarMaletinCajaMayorGQL extends Mutation<Response> {
  document = egresarMaletinCajaMayorMutation;
}
