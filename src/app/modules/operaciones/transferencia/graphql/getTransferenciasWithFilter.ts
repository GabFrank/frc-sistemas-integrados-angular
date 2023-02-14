import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciaQuery, transferenciaWithFiltersQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciasWithFilterGQL extends Query<Transferencia[]> {
  document = transferenciaWithFiltersQuery;
}
