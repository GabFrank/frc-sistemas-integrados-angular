import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciasPorUsuarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciasPorUsuarioGQL extends Query<Transferencia[]> {
  document = transferenciasPorUsuarioQuery;
}
