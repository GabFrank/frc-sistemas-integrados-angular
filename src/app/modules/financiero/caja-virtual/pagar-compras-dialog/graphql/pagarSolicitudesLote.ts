import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarSolicitudesLoteCajaMayorMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PagarSolicitudesLoteCajaMayorGQL extends Mutation<Response> {
  document = pagarSolicitudesLoteCajaMayorMutation;
}
