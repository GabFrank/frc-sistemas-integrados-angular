import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReporteSolicitudesPagoQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirReporteSolicitudesPagoGQL extends Query<string> {
  document = imprimirReporteSolicitudesPagoQuery;
}
