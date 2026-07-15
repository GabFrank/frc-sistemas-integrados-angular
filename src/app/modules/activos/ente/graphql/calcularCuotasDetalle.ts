import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CuotaDetalle, CuotasDetalleCalculado } from '../../shared/models/cuota-detalle.model';
import { calcularCuotasDetalleQuery } from './graphql-query';

export interface CalcularCuotasDetalleVariables {
  cantidadCuotas?: number;
  cantidadCuotasPagadas?: number;
  montoTotal?: number;
  montoYaPagado?: number;
  cuotasDetalle?: CuotaDetalle[];
}

export interface Response {
  data: CuotasDetalleCalculado;
}

@Injectable({ providedIn: 'root' })
export class CalcularCuotasDetalleGQL extends Query<Response, CalcularCuotasDetalleVariables> {
  override document = calcularCuotasDetalleQuery;
}
