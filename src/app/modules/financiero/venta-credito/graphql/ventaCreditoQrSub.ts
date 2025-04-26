import { Injectable } from '@angular/core';
import { Subscription } from 'apollo-angular';
import { VentaCreditoQRAuthUpdate } from '../venta-credito.model';
import { ventaCreditoAuthSubQuery } from './graphql-query';

export interface Response {
  data: VentaCreditoQRAuthUpdate;
}

@Injectable({
  providedIn: 'root',
})
export class VentaCreditoQrSubAuthGQL extends Subscription<Response> {
  document = ventaCreditoAuthSubQuery;
}
