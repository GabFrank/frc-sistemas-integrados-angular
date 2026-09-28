import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaCreditoItemsQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaCreditoItemsGQL extends Query<any> {
  document = notaCreditoItemsQuery;
}
