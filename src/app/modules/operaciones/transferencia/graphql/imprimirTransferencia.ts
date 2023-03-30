import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirTransferenciaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ImprimirTransferenciaGQL extends Query<boolean> {
  document = imprimirTransferenciaQuery;
}
