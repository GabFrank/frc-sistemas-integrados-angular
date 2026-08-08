import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { editarConteoCajaDesdeServidor } from './graphql-query';

export interface CajaFilialOperacionResult {
  exito: boolean;
  cajaId: number;
}

export interface Response {
  data: CajaFilialOperacionResult;
}

@Injectable({
  providedIn: 'root',
})
export class EditarConteoCajaDesdeServidorGQL extends Mutation<Response> {
  document = editarConteoCajaDesdeServidor;
}
