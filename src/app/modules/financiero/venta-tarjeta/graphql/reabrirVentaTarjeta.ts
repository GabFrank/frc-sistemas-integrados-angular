import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reabrirVentaTarjetaMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ReabrirVentaTarjetaGQL extends Mutation {
  document = reabrirVentaTarjetaMutation;
}
