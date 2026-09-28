import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { filtrarVentasTarjetaPorCajaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FiltrarVentasTarjetaPorCajaGQL extends Query<any> {
  document = filtrarVentasTarjetaPorCajaQuery;
}
