import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRemisionQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class NotaRemisionGQL extends Query<any> {
  document = notaRemisionQuery;
}
