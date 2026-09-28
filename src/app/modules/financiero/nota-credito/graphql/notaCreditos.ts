import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaCreditosQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaCreditosGQL extends Query<any> {
  document = notaCreditosQuery;
}
