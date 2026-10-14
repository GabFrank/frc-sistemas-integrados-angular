import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { cajaVirtualSucursalesQuery, guardarSucursalesDeCajaMutation } from './graphql-query';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';

/** La sucursal propia de una caja y las adicionales que cubre. */
export interface CajaVirtualSucursales {
  id: number;
  sucursal?: Sucursal;
  sucursalesAdicionales?: Sucursal[];
}

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualSucursalesGQL extends Query<Response> {
  document = cajaVirtualSucursalesQuery;
}

@Injectable({ providedIn: 'root' })
export class GuardarSucursalesDeCajaGQL extends Mutation<Response> {
  document = guardarSucursalesDeCajaMutation;
}
