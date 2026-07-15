import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveVentaTarjetaMutation } from './graphql-query';

export interface VentaTarjetaResult {
  id: number;
  sucursalId: number;
  estado: string;
  monto: number;
  creadoEn: string;
}

export interface Response {
  data: VentaTarjetaResult;
}

@Injectable({ providedIn: 'root' })
export class SaveVentaTarjetaGQL extends Mutation<Response> {
  document = saveVentaTarjetaMutation;
}
