import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { proximosNumerosChequeQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ProximosNumerosChequeGQL extends Query<Response> {
  document = proximosNumerosChequeQuery;
}
