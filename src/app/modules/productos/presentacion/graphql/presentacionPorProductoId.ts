import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Presentacion } from '../presentacion.model';
import { presentacionPorProductoId } from './graphql-query';


export interface Response {
  data: Presentacion[];
}

@Injectable({
  providedIn: 'root',
})
export class PresentacionPorProductoIdGQL extends Query<Response> {
  document = presentacionPorProductoId;
}
