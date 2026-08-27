import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { contarAdvertenciasQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ContarAdvertenciasGQL extends Query<Response> { document = contarAdvertenciasQuery; }
