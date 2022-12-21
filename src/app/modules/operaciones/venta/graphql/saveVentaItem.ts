import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaItem } from '../venta-item.model';
import { saveVentaItemQuery } from './graphql-query';

class Response {
  data: VentaItem
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaItemGQL extends Mutation<Response> {
  document = saveVentaItemQuery;
}
