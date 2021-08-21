import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Codigo } from '../codigo.model';
import { codigoPorCodigo, codigoPorProductoId } from './graphql-query';


export interface Response {
  data: Codigo[];
}


@Injectable({
  providedIn: 'root',
})
export class CodigosPorProductoIdGQL extends Query<Response> {
  document = codigoPorProductoId;
}


