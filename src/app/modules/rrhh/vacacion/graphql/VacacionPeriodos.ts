import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vacacionPeriodosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VacacionPeriodosGQL extends Query<Response> { document = vacacionPeriodosQuery; }
