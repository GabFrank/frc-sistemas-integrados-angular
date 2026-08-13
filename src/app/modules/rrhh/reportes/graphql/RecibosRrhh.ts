import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import {
  imprimirReciboAguinaldoQuery,
  imprimirReciboBonoQuery,
  imprimirReciboPenalizacionQuery,
  imprimirReciboPrestamoQuery,
  imprimirReciboValeQuery,
} from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboValeGQL extends Query<Response> { document = imprimirReciboValeQuery; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboPenalizacionGQL extends Query<Response> { document = imprimirReciboPenalizacionQuery; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboAguinaldoGQL extends Query<Response> { document = imprimirReciboAguinaldoQuery; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboPrestamoGQL extends Query<Response> { document = imprimirReciboPrestamoQuery; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboBonoGQL extends Query<Response> { document = imprimirReciboBonoQuery; }
