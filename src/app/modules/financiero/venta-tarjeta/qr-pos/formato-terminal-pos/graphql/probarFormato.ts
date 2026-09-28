import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { probarFormatoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ProbarFormatoGQL extends Query {
  document = probarFormatoQuery;
}
