import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReporteMovimientosCajaVirtualQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ImprimirReporteMovimientosCajaVirtualGQL extends Query<string> {
  document = imprimirReporteMovimientosCajaVirtualQuery;
}
