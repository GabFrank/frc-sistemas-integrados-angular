import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { prellenarNotaRemisionQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class PrellenarNotaRemisionGQL extends Query<any> {
  document = prellenarNotaRemisionQuery;
}
