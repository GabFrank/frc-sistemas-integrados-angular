import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countMaletinQuery } from './graphql-query';


@Injectable({
  providedIn: 'root',
})
export class CountMaletinGQL extends Query<number> {
  document = countMaletinQuery;
}
