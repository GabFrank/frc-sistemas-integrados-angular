import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { historialCambiosCategoriasQuery } from './query.graphql';

@Injectable({
  providedIn: 'root',
})
export class HistorialCambiosCategoriasGQL extends Query {
  document = historialCambiosCategoriasQuery;
}
