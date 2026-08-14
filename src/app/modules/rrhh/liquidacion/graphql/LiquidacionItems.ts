import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { liquidacionItemsQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class LiquidacionItemsGQL extends Query<Response> { document = liquidacionItemsQuery; }
