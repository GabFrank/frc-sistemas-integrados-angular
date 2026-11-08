import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajasWithFiltersTurno } from './graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasWithFiltersTurnoGQL extends Query<Response> {
  document = cajasWithFiltersTurno;
}
