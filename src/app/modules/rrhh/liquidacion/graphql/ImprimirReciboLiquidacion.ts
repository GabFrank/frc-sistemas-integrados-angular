import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboLiquidacionQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboLiquidacionGQL extends Query<Response> { document = imprimirReciboLiquidacionQuery; }
