import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPrevioAjusteQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetStockPrevioAjusteGQL extends Query<number> {
  document = stockPrevioAjusteQuery;
} 