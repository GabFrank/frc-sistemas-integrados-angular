import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { dashboardRrhhKpisQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DashboardRrhhKpisGQL extends Query<Response> { document = dashboardRrhhKpisQuery; }
