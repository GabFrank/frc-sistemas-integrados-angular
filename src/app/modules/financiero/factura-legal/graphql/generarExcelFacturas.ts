import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { facturaLegalesQuery, generarExcelFacturasQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal[];
}

@Injectable({
  providedIn: 'root',
})
export class GenerarExcelFacturasGQL extends Query<String> {
  document = generarExcelFacturasQuery;
}
