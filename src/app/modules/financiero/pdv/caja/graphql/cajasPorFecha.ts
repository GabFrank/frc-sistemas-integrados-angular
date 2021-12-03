import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaQuery, cajasPorFecha, cajasQuery } from './graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasPorFechaGQL extends Query<Response> {
  document = cajasPorFecha;
}
