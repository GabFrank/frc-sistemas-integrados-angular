import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { movimientosPorLoteQuery } from './graphql-query';
import { MovimientoLote } from '../lote.model';

export interface MovimientosPorLoteResponse {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: MovimientoLote[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosPorLoteGQL extends Query<MovimientosPorLoteResponse> {
  document = movimientosPorLoteQuery;
}
