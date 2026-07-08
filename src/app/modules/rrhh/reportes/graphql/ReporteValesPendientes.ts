import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteValesPendientesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ReporteValesPendientesGQL extends Query<Response> { document = reporteValesPendientesQuery; }
