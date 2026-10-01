import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboItemLiquidacionFinalQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboItemLiquidacionFinalGQL extends Query<Response> { document = imprimirReciboItemLiquidacionFinalQuery; }
