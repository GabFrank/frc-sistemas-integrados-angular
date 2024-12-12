import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionPorPedidoIdAndNumeroQuery } from './graphql-query';
import { PageInfo } from '../../../../../app.component';

export interface Response {
  data: PageInfo<NotaRecepcion>;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorIdAndNumeroGQL extends Query<Response> {
  document = notaRecepcionPorPedidoIdAndNumeroQuery;
}
