import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getNotaRecepcionItemListPorNotaRecepcionIdYSucursalesQuery } from './graphql-query';
import { NotaRecepcionItem } from '../nota-recepcion-item.model';

export interface GetNotaRecepcionItemListPorNotaRecepcionIdYSucursalesResponse {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: NotaRecepcionItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionItemListPorNotaRecepcionIdYSucursalesGQL extends Query<GetNotaRecepcionItemListPorNotaRecepcionIdYSucursalesResponse> {
  document = getNotaRecepcionItemListPorNotaRecepcionIdYSucursalesQuery;
} 