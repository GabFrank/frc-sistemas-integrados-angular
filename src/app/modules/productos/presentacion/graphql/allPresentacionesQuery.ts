import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Presentacion } from '../presentacion.model';
import { presentacionesQuery, presentacionQuery } from './graphql-query';


export interface Response {
  data: Presentacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllPresentacionesQueryGQL extends Query<Response> {
  document = presentacionesQuery;
}
