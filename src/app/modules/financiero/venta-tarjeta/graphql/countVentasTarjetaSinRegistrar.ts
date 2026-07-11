import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countVentasTarjetaSinRegistrarQuery } from './graphql-query';

export interface CountVentasTarjetaResponse {
  data: number;
}

@Injectable({ providedIn: 'root' })
export class CountVentasTarjetaSinRegistrarDesktopGQL extends Query<CountVentasTarjetaResponse> {
  document = countVentasTarjetaSinRegistrarQuery;
}
