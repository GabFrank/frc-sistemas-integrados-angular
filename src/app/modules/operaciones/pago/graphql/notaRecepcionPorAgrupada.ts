import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../../pedido/nota-recepcion/nota-recepcion.model';
import { notaRecepcionPorNotaRecepcionAgrupadaId } from './graphql-query';

export interface Response {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorAgrupadaQuery extends Query<Response> {
  document = notaRecepcionPorNotaRecepcionAgrupadaId;
} 