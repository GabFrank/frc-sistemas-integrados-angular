import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteResumenIpsQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ReporteResumenIpsGQL extends Query<Response> { document = reporteResumenIpsQuery; }
