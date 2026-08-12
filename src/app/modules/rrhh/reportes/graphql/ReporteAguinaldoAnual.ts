import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteAguinaldoAnualQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ReporteAguinaldoAnualGQL extends Query<Response> { document = reporteAguinaldoAnualQuery; }
