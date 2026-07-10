import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { filtrarVentasTarjetaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FiltrarVentasTarjetaGQL extends Query<any> {
  document = filtrarVentasTarjetaQuery;
}
