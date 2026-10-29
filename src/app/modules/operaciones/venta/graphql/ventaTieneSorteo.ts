import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaTieneSorteoQuery } from './graphql-query';

class Response {
  data: { id: number; tieneSorteo: boolean };
}

@Injectable({
  providedIn: 'root',
})
export class VentaTieneSorteoGQL extends Query<Response> {
  document = ventaTieneSorteoQuery;
}
