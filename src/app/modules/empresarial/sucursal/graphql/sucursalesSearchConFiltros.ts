import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalesSearchConFiltros } from './graphql-query';

export interface Response {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: Sucursal[];
    getPageable: {
      pageNumber: number;
      pageSize: number;
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class SucursalesSearchConFiltrosGQL extends Query<Response> {
  document = sucursalesSearchConFiltros;
} 