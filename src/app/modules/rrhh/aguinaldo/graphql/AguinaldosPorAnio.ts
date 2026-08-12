import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Aguinaldo } from '../aguinaldo.model';
import { aguinaldosPorAnioQuery } from './graphql-query';

export interface Response { data: Aguinaldo[]; }

@Injectable({ providedIn: 'root' })
export class AguinaldosPorAnioGQL extends Query<Response> { document = aguinaldosPorAnioQuery; }
