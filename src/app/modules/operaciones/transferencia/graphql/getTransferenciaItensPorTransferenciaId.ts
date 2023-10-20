import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia, TransferenciaItem } from '../transferencia.model';
import { transferenciaItemPorTransferenciaIdQuery, transferenciaQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { TransferListItem } from 'worker_threads';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaItensPorTransferenciaIdGQL extends Query<PageInfo<TransferListItem>> {
  document = transferenciaItemPorTransferenciaIdQuery;
}
