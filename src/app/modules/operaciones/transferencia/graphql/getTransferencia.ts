import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaGQL extends Query<Transferencia> {
  document = transferenciaQuery;
}
