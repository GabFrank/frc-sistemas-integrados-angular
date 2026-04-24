import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaAbiertoPorSucursalQuery } from './graphql-query';

export interface ResponseCajaAbiertoPorSucursal {
  data: Array<PdvCaja>;
}

@Injectable({
  providedIn: 'root',
})
export class CajaAbiertoPorSucursalGQL extends Query<ResponseCajaAbiertoPorSucursal> {
  document = cajaAbiertoPorSucursalQuery;
} 