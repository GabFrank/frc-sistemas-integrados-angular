import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';
import { notaRecepcionAgrupadaPorProveedorIdQuery } from './graphql-query';
import { PageInfo } from '../../../../../../app.component';

export interface Response {
  data: PageInfo<NotaRecepcionAgrupada>;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionAgrupadaPorProveedorIdGQL extends Query<Response> {
  document = notaRecepcionAgrupadaPorProveedorIdQuery;
}
