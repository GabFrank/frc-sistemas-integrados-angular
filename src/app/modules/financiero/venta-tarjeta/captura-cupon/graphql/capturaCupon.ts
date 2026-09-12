import { Injectable } from '@angular/core';
import { Mutation, Query, Subscription } from 'apollo-angular';
import { CapturaCupon, CapturaCuponQr } from '../captura-cupon.model';
import { capturaCuponQuery, capturaCuponSubQuery, crearCapturaCuponMutation } from './graphql-query';

export interface CrearCapturaCuponResponse {
  data: CapturaCuponQr;
}

export interface CapturaCuponResponse {
  data: CapturaCupon;
}

@Injectable({ providedIn: 'root' })
export class CrearCapturaCuponGQL extends Mutation<CrearCapturaCuponResponse> {
  document = crearCapturaCuponMutation;
}

@Injectable({ providedIn: 'root' })
export class CapturaCuponGQL extends Query<CapturaCuponResponse> {
  document = capturaCuponQuery;
}

@Injectable({ providedIn: 'root' })
export class CapturaCuponSubGQL extends Subscription<CapturaCuponResponse> {
  document = capturaCuponSubQuery;
}
