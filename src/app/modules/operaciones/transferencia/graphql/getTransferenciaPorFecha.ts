import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciaPorFechaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaPorFechaGQL extends Query<Transferencia[]> {
  document = transferenciaPorFechaQuery;
}
