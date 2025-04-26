import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';
import {
  notaRecepcionAgrupadaPorIdQuery
} from './graphql-query';

interface Response {
  data: NotaRecepcionAgrupada;
}

@Injectable({
  providedIn: 'root'
})
export class NotaRecepcionAgrupadaPorIdGQL extends Query<Response> {
  document = notaRecepcionAgrupadaPorIdQuery;
}
