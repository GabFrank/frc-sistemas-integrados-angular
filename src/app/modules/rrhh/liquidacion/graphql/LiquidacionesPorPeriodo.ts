import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { liquidacionesPorPeriodoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class LiquidacionesPorPeriodoGQL extends Query<Response> { document = liquidacionesPorPeriodoQuery; }
