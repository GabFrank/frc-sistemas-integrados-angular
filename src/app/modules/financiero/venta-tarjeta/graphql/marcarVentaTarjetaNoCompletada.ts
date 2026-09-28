import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { marcarVentaTarjetaNoCompletadaMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class MarcarVentaTarjetaNoCompletadaGQL extends Mutation {
  document = marcarVentaTarjetaNoCompletadaMutation;
}
