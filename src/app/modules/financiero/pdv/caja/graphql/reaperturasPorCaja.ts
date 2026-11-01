import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCajaReapertura } from '../caja.model';
import { reaperturasPorCajaQuery } from './graphql-query';

export interface Response {
  data: PdvCajaReapertura[];
}

@Injectable({
  providedIn: 'root',
})
export class ReaperturasPorCajaGQL extends Query<Response> {
  document = reaperturasPorCajaQuery;
}
