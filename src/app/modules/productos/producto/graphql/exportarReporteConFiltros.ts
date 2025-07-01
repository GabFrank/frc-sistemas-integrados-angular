import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { exportarReporteConFiltrosQuery } from './graphql-query';

interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExportarProductoConFiltrosGQL extends Query<Response> {
  document = exportarReporteConFiltrosQuery;
} 