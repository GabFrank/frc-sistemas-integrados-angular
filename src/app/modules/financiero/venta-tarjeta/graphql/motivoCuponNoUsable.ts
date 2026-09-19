import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { motivoCuponNoUsableQuery } from './graphql-query';

export interface MotivoCuponNoUsableResponse {
  data: string | null;
}

@Injectable({ providedIn: 'root' })
export class MotivoCuponNoUsableGQL extends Query<MotivoCuponNoUsableResponse> {
  document = motivoCuponNoUsableQuery;
}
