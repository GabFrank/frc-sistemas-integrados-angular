import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { TipoPrecio } from '../tipo-precio.model';
import { tipoPreciosQuery } from './graphql-query';


export interface Response {
  data: TipoPrecio[];
}


@Injectable({
  providedIn: 'root',
})
export class AllTiposPreciosGQL extends Query<Response> {
  document = tipoPreciosQuery;
}


