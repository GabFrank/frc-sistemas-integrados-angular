import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRemisionItemsQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaRemisionItemsGQL extends Query<any> {
  document = notaRemisionItemsQuery;
}
