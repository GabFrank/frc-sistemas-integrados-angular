import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionListPorUsuarioIdQuery } from './graphql-query';
import { PageInfo } from '../../../../../../app.component';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';

export interface Response {
  data: PageInfo<NotaRecepcionAgrupada>;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionListPorUsuarioIdGQL extends Query<Response> {
  document = notaRecepcionListPorUsuarioIdQuery;
}
