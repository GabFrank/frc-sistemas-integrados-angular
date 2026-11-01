import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CajaFilialOperacionResult } from '../../../conteo/graphql/editarConteoCaja';
import { reabrirCajaDesdeServidorQuery } from './graphql-query';

export interface Response {
  data: CajaFilialOperacionResult;
}

@Injectable({
  providedIn: 'root',
})
export class ReabrirCajaDesdeServidorGQL extends Mutation<Response> {
  document = reabrirCajaDesdeServidorQuery;
}
