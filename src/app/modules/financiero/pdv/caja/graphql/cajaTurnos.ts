import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaTurnos } from './graphql-query';

/** Turno de apertura de caja: desde su corte hasta el siguiente (hasta excluido), en HH:mm. */
export interface CajaTurno {
  turno: string;
  desde: string;
  hasta: string;
}

export interface Response {
  data: CajaTurno[];
}

@Injectable({
  providedIn: 'root',
})
export class CajaTurnosGQL extends Query<Response> {
  document = cajaTurnos;
}
