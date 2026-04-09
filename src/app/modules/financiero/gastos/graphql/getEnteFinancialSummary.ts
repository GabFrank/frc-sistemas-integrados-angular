import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class EnteFinancialSummaryGQL extends Query<any> {
  document = gql`
    query getEnteFinancialSummary($enteId: ID!) {
      data: getEnteFinancialSummary(enteId: $enteId) {
        enteId
        descripcion
        montoTotal
        montoYaPagado
        montoPendiente
        cuotasTotales
        cuotasPagadas
        cuotasFaltantes
        diaVencimiento
        diasParaVencer
        estadoCuota
        monedaSimbolo
        monedaId
        proveedorNombre
        tipoGastoSugeridoId
        situacionPago
        porcentajePagado
        montoSugerido
      }
    }
  `;
}
