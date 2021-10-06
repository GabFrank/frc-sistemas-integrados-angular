import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Codigo } from '../codigo.model';
import { codigoPorCodigo, codigosPorPresentacionId } from './graphql-query';


export interface Response {
  data: Codigo[];
}


@Injectable({
  providedIn: 'root',
})
export class CodigosPorPresentacionIdGQL extends Query<Response> {
  document = codigosPorPresentacionId;
}


