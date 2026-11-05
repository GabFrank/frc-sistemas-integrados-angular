import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Venta } from '../venta.model';
import { saveVentaClienteSorteo, saveVentaSorteo } from './graphql-query';

class Response {
  data: Venta
}

/** saveVenta con participante de sorteo (solo cuando hay uno; ver el documento). */
@Injectable({
  providedIn: 'root',
})
export class SaveVentaSorteoGQL extends Mutation<Response> {
  document = saveVentaSorteo;
}

/** saveVenta en modo "Imprimir desde esta PC" con participante de sorteo. */
@Injectable({
  providedIn: 'root',
})
export class SaveVentaClienteSorteoGQL extends Mutation<Response> {
  document = saveVentaClienteSorteo;
}
