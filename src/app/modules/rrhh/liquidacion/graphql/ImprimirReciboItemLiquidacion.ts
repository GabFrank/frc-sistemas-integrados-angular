import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboItemLiquidacionQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboItemLiquidacionGQL extends Query<Response> { document = imprimirReciboItemLiquidacionQuery; }
