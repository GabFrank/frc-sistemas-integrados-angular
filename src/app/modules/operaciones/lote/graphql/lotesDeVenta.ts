import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { lotesDeVentaQuery } from './graphql-query';
import { LoteVentaItem } from '../lote.model';

export interface LotesDeVentaResponse {
  data: LoteVentaItem[];
}

@Injectable({
  providedIn: 'root'
})
export class LotesDeVentaGQL extends Query<LotesDeVentaResponse> {
  document = lotesDeVentaQuery;
}
