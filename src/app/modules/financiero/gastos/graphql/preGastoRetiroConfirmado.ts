import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { preGastoRetiroConfirmadoQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({ providedIn: 'root' })
export class PreGastoRetiroConfirmadoGQL extends Query<Response> {
  document = preGastoRetiroConfirmadoQuery;
}
