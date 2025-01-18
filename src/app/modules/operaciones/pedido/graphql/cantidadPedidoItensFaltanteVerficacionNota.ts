import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cantidadItensFaltaVerificarNotaQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItensFaltaVerificacionNotaGQL extends Query<Response> {
  document = cantidadItensFaltaVerificarNotaQuery;
}
