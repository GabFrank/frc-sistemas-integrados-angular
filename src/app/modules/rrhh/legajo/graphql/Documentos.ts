import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DocumentosGQL extends Query<Response> { document = documentosQuery; }
