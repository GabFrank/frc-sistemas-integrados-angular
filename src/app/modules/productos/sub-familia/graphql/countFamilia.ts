import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countSubfamiliaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CountSubfamiliaGQL extends Query<any> {
  document = countSubfamiliaQuery;
}
