import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { transferirPropiedadCajaMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class TransferirPropiedadCajaGQL extends Mutation<Response> {
  document = transferirPropiedadCajaMutation;
}
