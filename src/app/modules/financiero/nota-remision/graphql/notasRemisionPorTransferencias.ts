import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notasRemisionPorTransferenciasQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotasRemisionPorTransferenciasGQL extends Query<any> {
  document = notasRemisionPorTransferenciasQuery;
}
