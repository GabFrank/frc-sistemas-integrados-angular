import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Response } from './allFamilias';
import { familiasSearch } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FamiliasSearchGQL extends Query<Response> {
  document = familiasSearch;
}
