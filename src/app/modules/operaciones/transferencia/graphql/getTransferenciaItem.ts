import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TransferenciaItem } from '../transferencia.model';
import { transferenciaItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaItemGQL extends Query<TransferenciaItem> {
  document = transferenciaItemQuery;
}
