import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRemisionPorTransferenciaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaRemisionPorTransferenciaGQL extends Query<any> {
  document = notaRemisionPorTransferenciaQuery;
}
