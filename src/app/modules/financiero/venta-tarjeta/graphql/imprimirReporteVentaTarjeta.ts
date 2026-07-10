import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReporteVentaTarjetaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirReporteVentaTarjetaGQL extends Query<string> {
  document = imprimirReporteVentaTarjetaQuery;
}
