import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { LiquidacionConcepto } from '../liquidacion-concepto.model';
import { liquidacionConceptosQuery } from './graphql-query';

export interface Response {
  data: LiquidacionConcepto[];
}

@Injectable({ providedIn: 'root' })
export class LiquidacionConceptosGQL extends Query<Response> {
  document = liquidacionConceptosQuery;
}
