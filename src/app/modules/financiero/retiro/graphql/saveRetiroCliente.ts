import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Retiro } from '../retiro.model';
import { saveRetiroCliente } from './graphql-query';

export interface Response {
  data: Retiro;
}

/** saveRetiro en modo "Imprimir desde esta PC" (ver ImpresionPosService). */
@Injectable({
  providedIn: 'root',
})
export class SaveRetiroClienteGQL extends Mutation<Response> {
  document = saveRetiroCliente;
}
