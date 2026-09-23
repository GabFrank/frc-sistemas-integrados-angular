import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cobrosTarjetaDeVentaQuery } from './graphql-query';

/** Un cobro de la venta, tal como lo devuelve el filial. */
export interface CobroDetalleDeVenta {
  id: number;
  valor: number;
  pago: boolean;
  vuelto: boolean;
  descuento: boolean;
  identificadorTransaccion?: string;
  formaPago?: { id: number; descripcion: string };
  moneda?: { id: number; simbolo: string };
}

export interface CobrosTarjetaDeVentaResponse {
  data: {
    id: number;
    cobro?: { id: number; cobroDetalleList?: CobroDetalleDeVenta[] };
  };
}

@Injectable({ providedIn: 'root' })
export class CobrosTarjetaDeVentaGQL extends Query<CobrosTarjetaDeVentaResponse> {
  document = cobrosTarjetaDeVentaQuery;
}
