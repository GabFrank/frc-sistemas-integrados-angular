import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { probarConexionIaMutation } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProbarConexionIaGQL extends Mutation<Response> {
  document = probarConexionIaMutation;
}
