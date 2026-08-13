import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteNominaMesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ReporteNominaMesGQL extends Query<Response> { document = reporteNominaMesQuery; }
