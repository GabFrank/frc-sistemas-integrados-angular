import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRemisionesQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaRemisionesGQL extends Query<any> {
  document = notaRemisionesQuery;
}
