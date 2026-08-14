import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ChequeResumenDia } from '../cheque.model';

import { chequesResumenPorDiaQuery } from './graphql-query';

export interface Response {
  data: ChequeResumenDia[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesResumenPorDiaGQL extends Query<Response> {
  document = chequesResumenPorDiaQuery;
}
