import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { valorMaletinQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ValorMaletinGQL extends Query<Response> {
  document = valorMaletinQuery;
}
