import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirNotaCreditoQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirNotaCreditoGQL extends Query<any> {
  document = imprimirNotaCreditoQuery;
}
