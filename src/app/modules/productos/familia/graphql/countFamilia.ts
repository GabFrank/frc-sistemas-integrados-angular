import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Familia } from '../familia.model';
import { countFamiliaQuery, familiaQuery, familiasSearch } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CountFamiliaGQL extends Query<any> {
  document = countFamiliaQuery;
}
