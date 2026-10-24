import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajasWithFiltersActivo } from './graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasWithFiltersActivoGQL extends Query<Response> {
  document = cajasWithFiltersActivo;
}
