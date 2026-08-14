import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ingresarMaletinCajaMayorMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class IngresarMaletinCajaMayorGQL extends Mutation<Response> {
  document = ingresarMaletinCajaMayorMutation;
}
