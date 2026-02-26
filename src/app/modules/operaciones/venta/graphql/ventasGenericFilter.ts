import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventasGenericFilterQuery } from './graphql-query';

export interface VentasFilterResponse {
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class VentasGenericFilterGQL extends Query<VentasFilterResponse> {
  document = ventasGenericFilterQuery;
}
