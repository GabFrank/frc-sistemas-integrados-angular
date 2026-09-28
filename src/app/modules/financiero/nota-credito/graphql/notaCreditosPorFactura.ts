import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaCreditosPorFacturaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaCreditosPorFacturaGQL extends Query<any> {
  document = notaCreditosPorFacturaQuery;
}
