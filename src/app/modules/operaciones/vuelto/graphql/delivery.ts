import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vuelto } from '../vuelto.model';
import { vueltosQuery } from './graphql-query';

export interface Response {
  data: Vuelto[];
}

@Injectable({
  providedIn: 'root',
})
export class VueltosGetAllGQL extends Query<Response> {
  document = vueltosQuery;
}
