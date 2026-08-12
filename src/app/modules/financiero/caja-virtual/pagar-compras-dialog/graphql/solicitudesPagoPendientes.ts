import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { solicitudesPagoPendientesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SolicitudesPagoPendientesGQL extends Query<Response> {
  document = solicitudesPagoPendientesQuery;
}
