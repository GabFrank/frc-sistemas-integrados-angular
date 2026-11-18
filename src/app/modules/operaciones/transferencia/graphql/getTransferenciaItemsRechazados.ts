import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { transferenciaItemsRechazadosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaItemsRechazadosGQL extends Query<any> {
  document = transferenciaItemsRechazadosQuery;
}
