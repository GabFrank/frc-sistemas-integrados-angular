import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia, TransferenciaItem } from '../transferencia.model';
import { transferenciaItemPorTransferenciaIdQuery, transferenciaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaItensPorTransferenciaIdGQL extends Query<TransferenciaItem[]> {
  document = transferenciaItemPorTransferenciaIdQuery;
}
