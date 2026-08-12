import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vacacionVentasQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VacacionVentasGQL extends Query<Response> { document = vacacionVentasQuery; }
