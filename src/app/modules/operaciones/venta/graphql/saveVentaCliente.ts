import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Venta } from '../venta.model';
import { saveVentaCliente } from './graphql-query';

class Response {
  data: Venta
}

/** saveVenta en modo "Imprimir desde esta PC" (ver ImpresionPosService). */
@Injectable({
  providedIn: 'root',
})
export class SaveVentaClienteGQL extends Mutation<Response> {
  document = saveVentaCliente;
}
