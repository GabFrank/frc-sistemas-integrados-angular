import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirNotaRemisionQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirNotaRemisionGQL extends Query<any> {
  document = imprimirNotaRemisionQuery;
}
