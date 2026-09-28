import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { muestrasDeFormatoQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class MuestrasDeFormatoGQL extends Query<any> {
  document = muestrasDeFormatoQuery;
}
