import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reportePrestamosActivosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ReportePrestamosActivosGQL extends Query<Response> { document = reportePrestamosActivosQuery; }
