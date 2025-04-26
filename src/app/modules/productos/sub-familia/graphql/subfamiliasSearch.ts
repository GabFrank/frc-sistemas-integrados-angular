import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Response } from './allFamilias';
import { subfamiliasSearch } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SubfamiliasSearchGQL extends Query<Response> {
  document = subfamiliasSearch;
}
