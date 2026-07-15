import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Impresora } from '../impresora.model';
import { impresoraSearchPageQuery } from './graphql-query';

export interface ImpresoraPageResponse {
  data: {
    content: Impresora[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ImpresoraSearchPageGQL extends Query<ImpresoraPageResponse> {
  document = impresoraSearchPageQuery;
}
