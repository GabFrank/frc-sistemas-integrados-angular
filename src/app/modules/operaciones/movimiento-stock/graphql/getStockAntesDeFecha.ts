import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockAntesDeFechaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetStockAntesDeFechaGQL extends Query<{data: number}> {
  document = stockAntesDeFechaQuery;
} 