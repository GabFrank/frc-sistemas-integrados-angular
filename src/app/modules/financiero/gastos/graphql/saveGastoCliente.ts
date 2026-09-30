import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { saveGastoCliente } from './graphql-query';

export interface Response {
  data: Gasto;
}

/** saveGasto en modo "Imprimir desde esta PC" (ver ImpresionPosService). */
@Injectable({
  providedIn: 'root',
})
export class SaveGastoClienteGQL extends Mutation<Response> {
  document = saveGastoCliente;
}
