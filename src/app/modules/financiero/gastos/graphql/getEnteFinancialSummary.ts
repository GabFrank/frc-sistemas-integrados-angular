import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class EnteFinancialSummaryGQL extends Query<any> {
  document = gql`
    query getEnteFinancialSummary($enteId: ID!, $tipoGastoId: ID) {
      data: getEnteFinancialSummary(enteId: $enteId, tipoGastoId: $tipoGastoId) {
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
        proveedorId
        tipoGastoSugeridoId
        situacionPago
        porcentajePagado
        montoSugerido
        descripcionSugerida
        autocompletarMonto
        numeroCuotaActual
        fechaVencimientoSugerida
      }
    }
  `;
}
