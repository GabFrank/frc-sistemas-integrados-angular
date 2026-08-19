import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { detalleDePagoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DetalleDePagoGQL extends Query<Response> {
  document = detalleDePagoQuery;
}
