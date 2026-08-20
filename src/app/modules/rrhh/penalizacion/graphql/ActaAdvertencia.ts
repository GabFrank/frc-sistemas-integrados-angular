import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { actaAdvertenciaQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ActaAdvertenciaGQL extends Query<Response> { document = actaAdvertenciaQuery; }
