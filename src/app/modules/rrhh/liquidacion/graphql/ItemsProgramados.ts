import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { itemsProgramadosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ItemsProgramadosGQL extends Query<Response> { document = itemsProgramadosQuery; }
