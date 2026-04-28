import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { VentaPorPeriodo } from '../models/venta-por-periodo.model';

export interface VentaPorPeriodoResponse {
    data: VentaPorPeriodo[];
}

const ventaPorPeriodoQuery = gql`
  query ventaPorPeriodo($inicio: String, $fin: String, $sucId: ID) {
    data: ventaPorPeriodo(inicio: $inicio, fin: $fin, sucId: $sucId) {
      creadoEn
      valorGs
      valorRs
      valorDs
      valorTotalGs
      cantVenta
    }
  }
`;

@Injectable({
    providedIn: 'root',
})
export class VentaPorPeriodoGQL extends Query<VentaPorPeriodoResponse> {
    document = ventaPorPeriodoQuery;
}
