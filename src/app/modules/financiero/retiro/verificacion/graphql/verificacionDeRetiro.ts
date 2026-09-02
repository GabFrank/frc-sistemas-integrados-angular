import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { verificacionDeRetiroQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VerificacionDeRetiroGQL extends Query<Response> {
  document = verificacionDeRetiroQuery;
}
