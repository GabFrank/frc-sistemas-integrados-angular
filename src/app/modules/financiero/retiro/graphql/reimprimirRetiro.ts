import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Retiro } from '../retiro.model';
import { reimprimirRetiro } from './graphql-query';

export interface Response {
  data: Retiro[];
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirRetiroGQL extends Query<boolean> {
  document = reimprimirRetiro;
}
