import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { liquidacionesPorFuncionarioQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class LiquidacionesPorFuncionarioGQL extends Query<Response> { document = liquidacionesPorFuncionarioQuery; }
