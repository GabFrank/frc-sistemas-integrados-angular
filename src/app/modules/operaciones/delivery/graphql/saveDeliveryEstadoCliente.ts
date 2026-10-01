import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { saveDeliveryEstadoClienteQuery } from './graphql-query';

export interface Response {
  data: Delivery;
}

/** saveDeliveryEstado en modo "Imprimir desde esta PC" (ver ImpresionPosService). */
@Injectable({
  providedIn: 'root',
})
export class SaveDeliveryEstadoClienteGQL extends Mutation<Response> {
  document = saveDeliveryEstadoClienteQuery;
}
