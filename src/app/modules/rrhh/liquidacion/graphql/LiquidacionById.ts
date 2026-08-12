import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { liquidacionByIdQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class LiquidacionByIdGQL extends Query<Response> { document = liquidacionByIdQuery; }
