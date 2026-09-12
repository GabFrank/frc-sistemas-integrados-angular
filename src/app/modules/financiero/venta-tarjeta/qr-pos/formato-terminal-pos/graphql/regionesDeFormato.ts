import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { regionesDeFormatoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class RegionesDeFormatoGQL extends Query {
  document = regionesDeFormatoQuery;
}
