import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { exportarReporteQuery } from './graphql-query';

interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExportarProductoGQL extends Query<Response> {
  document = exportarReporteQuery;
}
