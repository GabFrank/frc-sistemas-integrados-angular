import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReporteMovimientosBancariosQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirReporteMovimientosBancariosGQL extends Query<string> {
  document = imprimirReporteMovimientosBancariosQuery;
}
