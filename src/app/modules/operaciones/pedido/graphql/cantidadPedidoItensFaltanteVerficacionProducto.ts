import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cantidadItensFaltaVerificarProductoQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItensFaltaVerificacionProductoGQL extends Query<Response> {
  document = cantidadItensFaltaVerificarProductoQuery;
}
