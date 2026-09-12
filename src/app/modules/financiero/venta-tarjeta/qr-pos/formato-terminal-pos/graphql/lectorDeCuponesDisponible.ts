import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { lectorDeCuponesDisponibleQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class LectorDeCuponesDisponibleGQL extends Query {
  document = lectorDeCuponesDisponibleQuery;
}
