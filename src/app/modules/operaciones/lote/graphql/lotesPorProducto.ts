import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { lotesPorProductoQuery } from './graphql-query';
import { Lote } from '../lote.model';

export interface LotesPorProductoResponse {
  data: Lote[];
}

@Injectable({
  providedIn: 'root'
})
export class LotesPorProductoGQL extends Query<LotesPorProductoResponse> {
  document = lotesPorProductoQuery;
}
