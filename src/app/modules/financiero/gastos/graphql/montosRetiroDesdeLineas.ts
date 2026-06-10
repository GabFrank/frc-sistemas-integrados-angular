import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MontosRetiroPayload } from '../models/montos-retiro-payload.model';
import { montosRetiroDesdeLineasQuery } from './graphql-query';

export interface Response {
  data: MontosRetiroPayload;
}

@Injectable({ providedIn: 'root' })
export class MontosRetiroDesdeLineasGQL extends Query<Response> {
  document = montosRetiroDesdeLineasQuery;
}
