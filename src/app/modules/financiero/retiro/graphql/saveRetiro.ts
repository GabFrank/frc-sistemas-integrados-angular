import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Retiro } from '../retiro.model';
import { saveRetiro } from './graphql-query';

export interface Response {
  data: Retiro;
}

@Injectable({
  providedIn: 'root',
})
export class SaveRetiroGQL extends Mutation<Response> {
  document = saveRetiro;
}
