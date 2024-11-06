import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Venta } from '../venta.model';
import { saveVentaDelivery } from './graphql-query';

class Response {
  data: Venta
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaDeliveryGQL extends Mutation<Response> {
  document = saveVentaDelivery;
}
