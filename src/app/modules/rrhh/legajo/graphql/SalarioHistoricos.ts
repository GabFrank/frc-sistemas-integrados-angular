import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { salarioHistoricosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SalarioHistoricosGQL extends Query<Response> { document = salarioHistoricosQuery; }
