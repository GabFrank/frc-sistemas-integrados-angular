import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { historialCambiosQuery } from './query.graphql';

@Injectable({
  providedIn: 'root',
})
export class HistorialCambiosGQL extends Query {
  document = historialCambiosQuery;
}
