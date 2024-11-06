import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { verificarCajaQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class VerificarCajaGQL extends Query<Response> {
  document = verificarCajaQuery;
}


