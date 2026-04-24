import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countPagoDetalleCuotaQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class GetCountPagoDetalleCuotaGQL extends Query<Response> {
  document = countPagoDetalleCuotaQuery;
} 