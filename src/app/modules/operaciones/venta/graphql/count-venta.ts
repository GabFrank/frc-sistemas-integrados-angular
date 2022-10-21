import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countVentaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CountVentaGQL extends Query<number> {
  document = countVentaQuery;
}
