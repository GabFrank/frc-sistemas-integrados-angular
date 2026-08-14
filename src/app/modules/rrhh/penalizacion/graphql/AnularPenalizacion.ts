import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Penalizacion } from '../penalizacion.model';
import { anularPenalizacionMutation } from './graphql-query';

export interface Response {
  data: Penalizacion;
}

@Injectable({ providedIn: 'root' })
export class AnularPenalizacionGQL extends Mutation<Response> {
  document = anularPenalizacionMutation;
}
